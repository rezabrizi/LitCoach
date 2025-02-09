import axios from "axios";

console.log("Background script running!");

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const LEETCODE_PROBLEM_URL = "https://leetcode.com/problems/";
const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";
const LEETCODE_SUBMISSION_DETAILS_QUERY = `
    query submissionDetails($submissionId: Int!) {
        submissionDetails(submissionId: $submissionId) {
            runtimeDisplay
            runtimePercentile
            memoryDisplay
            memoryPercentile
            code
            timestamp
            lang {
                name
                verboseName
            }
            question {
                questionId
                title
                titleSlug
                content
                difficulty
            }
            runtimeError
            compileError
        }
    }
`;

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Check if the current tab is a LeetCode problem page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "isLeetCodeProblem") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([{ url }]) => {
            if (url.startsWith(LEETCODE_PROBLEM_URL)) {
                const problemName = url.split(LEETCODE_PROBLEM_URL)[1].split("/")[0];
                sendResponse({ value: true, problemName });
            } else {
                sendResponse({ value: false });
            }
        });
        return true;
    }
});

// Get the editor value from the Monaco editor
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getEditorValue") {
        chrome.tabs.query({ active: true, currentWindow: true }, async ([{ id, url }]) => {
            if (!url.startsWith(LEETCODE_PROBLEM_URL)) return sendResponse({ success: false });

            const [result] = await chrome.scripting.executeScript({
                target: { tabId: id },
                world: "MAIN",
                func: () => {
                    return window.monaco.editor.getModels()[0].getValue();
                },
            });
            sendResponse(result?.result ? { success: true, value: result.result } : { success: false });
        });
        return true;
    }
});

// Get the problem description from the meta tag
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getProblemDescription") {
        chrome.tabs.query({ active: true, currentWindow: true }, async ([{ id, url }]) => {
            if (!url.startsWith(LEETCODE_PROBLEM_URL)) return sendResponse({ success: false });

            const [result] = await chrome.scripting.executeScript({
                target: { tabId: id },
                func: () => document.querySelector('meta[name="description"]')?.content || null,
            });
            sendResponse(result?.result ? { success: true, value: result.result } : { success: false });
        });
        return true;
    }
});

// Monitor for submission result changes
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.url?.startsWith(LEETCODE_PROBLEM_URL) && changeInfo.status === "complete") {
        chrome.storage.sync.get(["selected_repo_id", "github_user_id"], (data) => {
            if (!data.selected_repo_id || !data.github_user_id) return;

            const submissionMatch = tab.url.match(/submissions\/(\d+)/);
            if (submissionMatch) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: (submissionId) => {
                        chrome.runtime.sendMessage({
                            action: "submissionAccepted",
                            submissionId: submissionId,
                        });
                    },
                    args: [submissionMatch[1]],
                });
            }
        });
    }
});

// Function to fetch submission details using GraphQL
async function fetchSubmissionDetails(submissionId) {
    try {
        const response = await axios.post(LEETCODE_GRAPHQL_URL, {
            query: LEETCODE_SUBMISSION_DETAILS_QUERY,
            variables: { submissionId: parseInt(submissionId) },
        });

        return response.data.data.submissionDetails;
    } catch (error) {
        console.error("Error fetching submission details:", error);
        return null;
    }
}

// Handle submission accepted message
chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "submissionAccepted") {
        chrome.storage.sync.get(["github_user_id", "selected_repo_id"], async (data) => {
            if (!data.github_user_id || !data.selected_repo_id) {
                console.error("GitHub user ID or selected repo ID not found");
                return;
            }

            const details = await fetchSubmissionDetails(message.submissionId);
            if (!details) {
                console.error("Failed to fetch submission details");
                return;
            }

            if (details.runtimeError || details.compileError) {
                console.log("Submission failed with runtime error or compile error");
                return;
            }

            const now = new Date();
            const submissionDate = new Date(details.timestamp * 1000);
            if (
                submissionDate.getUTCFullYear() !== now.getUTCFullYear() ||
                submissionDate.getUTCMonth() !== now.getUTCMonth() ||
                submissionDate.getUTCDate() !== now.getUTCDate() ||
                submissionDate.getUTCHours() !== now.getUTCHours() ||
                submissionDate.getUTCMinutes() !== now.getUTCMinutes()
            ) {
                console.log("Submission was not made recently");
                return;
            }

            try {
                await axios.post(`${API_URL}/user/submit_problem`, {
                    ...details,
                    user_github_id: data.github_user_id,
                    github_repo_id: data.selected_repo_id,
                });
            } catch (error) {
                console.error(error);
            }
        });
        return true;
    }
});

// Check if the user is authenticated with GitHub
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "isAuthenticated") {
        chrome.storage.sync.get("github_user_id", async (data) => {
            if (!data.github_user_id) {
                sendResponse({ authenticated: false });
                return;
            }

            try {
                await axios.get(`${API_URL}/user/valid_user`, {
                    params: { github_id: data.github_user_id },
                });
                sendResponse({ authenticated: true });
            } catch (error) {
                console.error(error);
                sendResponse({ authenticated: false });
            }
        });

        return true;
    }
});
