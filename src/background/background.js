import axios from "axios";

console.log("Background script running!");

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const LEETCODE_PROBLEM_URL = "https://leetcode.com/problems/";
const LEETCODE_CONTEST_URL_REGEX = /^https:\/\/leetcode\.com\/contest\/[^/]+\/problems$/;
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

// Function to check if the current tab is a LeetCode problem
function checkIfLeetCodeProblem(tab) {
    const isLeetCodeProblem =
        tab.url && (tab.url.startsWith(LEETCODE_PROBLEM_URL) || tab.url.startsWith(LEETCODE_CONTEST_URL_REGEX));
    chrome.runtime.sendMessage({ isLeetCodeProblem }, () => {
        const errorMessage = chrome.runtime.lastError?.message;
        // Ignore these errors since sidepanel may not always be open
        if (
            errorMessage &&
            errorMessage !== "Could not establish connection. Receiving end does not exist." &&
            errorMessage !== "The message port closed before a response was received."
        ) {
            console.error(errorMessage);
        }
    });
}

// Monitor for tab updates
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (changeInfo.status === "complete" && tab.url) {
        checkIfLeetCodeProblem(tab);
    }
});

// Monitor for tab switches
chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.get(tabId, (tab) => {
        checkIfLeetCodeProblem(tab);
    });
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
            sendResponse(result?.result);
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
            sendResponse(result?.result);
        });
        return true;
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

// Monitor for submission result changes
chrome.tabs.onUpdated.addListener((_, changeInfo, tab) => {
    if (tab.url?.startsWith(LEETCODE_PROBLEM_URL) && changeInfo.status === "complete") {
        chrome.storage.sync.get(["selected_repo_id", "user_id"], async (data) => {
            if (!data.selected_repo_id || !data.user_id) return;

            const submissionMatch = tab.url.match(/submissions\/(\d+)/);
            if (submissionMatch) {
                const details = await fetchSubmissionDetails(submissionMatch[1]);
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
                    await axios.post(`${API_URL}/user/github/submission`, {
                        ...details,
                        user_id: data.user_id,
                        github_repo_id: data.selected_repo_id,
                    });
                    console.log("Successfully submitted problem to user's selected github repo");
                } catch (error) {
                    console.error(error);
                }
            }
        });
    }
});

// Check if the user is authenticated with GitHub
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "isAuthenticated") {
        chrome.storage.sync.get(["user_id"], async (stored) => {
            if (!stored.user_id) return sendResponse(false);

            try {
                const { data } = await axios.get(`${API_URL}/user/info`, {
                    params: { user_id: stored.user_id },
                });
                await chrome.storage.sync.set({ user_data: data });
                sendResponse(true);
            } catch (error) {
                console.error(error);
                sendResponse(false);
            }
        });

        return true;
    }
});
