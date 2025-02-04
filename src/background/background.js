import axios from "axios";

console.log("Background script running!");

const LEETCODE_URL = "https://leetcode.com/problems/";
const GRAPHQL_URL = "https://leetcode.com/graphql";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Check if the current tab is a LeetCode problem page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "isLeetCodeProblem") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([{ url }]) =>
            sendResponse({ value: url.startsWith(LEETCODE_URL) }),
        );
        return true;
    }
});

// Get the editor value from the Monaco editor
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getEditorValue") {
        chrome.tabs.query({ active: true, currentWindow: true }, async ([{ id, url }]) => {
            if (!url.startsWith(LEETCODE_URL)) return sendResponse({ success: false });

            const [result] = await chrome.scripting.executeScript({
                target: { tabId: id },
                world: "MAIN",
                func: () => {
                    const isPremium =
                        document.querySelector(".text-brand-orange")?.textContent.trim() === "Premium";
                    return window.monaco.editor.getModels()[isPremium ? 0 : 1].getValue();
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
            if (!url.startsWith(LEETCODE_URL)) return sendResponse({ success: false });

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
    if (tab.url?.startsWith(LEETCODE_URL) && changeInfo.status === "complete") {
        chrome.storage.sync.get(["selected_repo_id", "github_user_id"], (data) => {
            if (!data.selected_repo_id || !data.github_user_id) return;

            const submissionMatch = tab.url.match(/submissions\/(\d+)/);
            if (submissionMatch) {
                chrome.scripting.executeScript({
                    target: { tabId: tabId },
                    func: (submissionId) => {
                        const submissionStatus = document.querySelector(
                            'span[data-e2e-locator="submission-result"]',
                        );

                        if (submissionStatus?.textContent.includes("Accepted")) {
                            chrome.runtime.sendMessage({
                                action: "submissionAccepted",
                                submissionId: submissionId,
                            });
                        }
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
        const query = `
            query submissionDetails($submissionId: Int!) {
                submissionDetails(submissionId: $submissionId) {
                    runtime
                    runtimeDisplay
                    runtimePercentile
                    runtimeDistribution
                    memory
                    memoryDisplay
                    memoryPercentile
                    memoryDistribution
                    code
                    timestamp
                    statusCode
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
                    notes
                    topicTags {
                        tagId
                        slug
                        name
                    }
                    runtimeError
                }
            }
        `;

        const response = await axios.post(GRAPHQL_URL, {
            query,
            variables: { submissionId: parseInt(submissionId) },
        });

        return response.data.data.submissionDetails;
    } catch (error) {
        console.error("Error fetching submission details:", error);
        return null;
    }
}

// Handle submission accepted message
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
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

            const now = new Date();
            const submissionDate = new Date(details.timestamp * 1000);
            if (
                submissionDate.getUTCFullYear() !== now.getUTCFullYear() ||
                submissionDate.getUTCMonth() !== now.getUTCMonth() ||
                submissionDate.getUTCDate() !== now.getUTCDate() ||
                submissionDate.getUTCHours() !== now.getUTCHours() ||
                submissionDate.getUTCMinutes() !== now.getUTCMinutes()
            ) {
                return;
            }

            const metrics = {
                question_id: details.question.questionId,
                question_title: details.question.title,
                question_content: details.question.content,
                code: details.code,
                language: details.lang.verboseName,
                user_github_id: data.github_user_id,
                github_repo_id: data.selected_repo_id,
                runtime: details.runtimeDisplay,
                runtime_percentile: `${parseFloat(details.runtimePercentile).toFixed(2)}%`,
                memory: details.memoryDisplay,
                memory_percentile: `${parseFloat(details.memoryPercentile).toFixed(2)}%`,
            };

            try {
                await axios.post(`${API_URL}/user/submit_problem`, metrics);
            } catch (error) {
                console.error(error.response?.data?.detail || "Failed to submit problem");
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
                console.error(error.response?.data?.detail || "User not authenticated");
                sendResponse({ authenticated: false });
            }
        });

        return true;
    }
});
