import axios from "axios";

console.log("Background script running!");

const LEETCODE_URL = "https://leetcode.com/problems/";
const GITHUB_CLIENT_ID = import.meta.env.VITE_GITHUB_CLIENT_ID;
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Enable the side panel on LeetCode problem pages
chrome.tabs.onUpdated.addListener(async (tabId, _, { url }) => {
    if (url.startsWith(LEETCODE_URL)) {
        await chrome.sidePanel.setOptions({ tabId, path: "index.html", enabled: true });
    }
});

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
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                if (window.__monitorSubmissionInjected) return;
                window.__monitorSubmissionInjected = true;

                const targetNode = document.querySelector("body");

                const observer = new MutationObserver(() => {
                    const resultElement = document.querySelector('span[data-e2e-locator="submission-result"]');
                    if (resultElement && resultElement.textContent.includes("Accepted")) {
                        console.log("Submission Accepted!");

                        chrome.runtime.sendMessage({ action: "getProblemDescription" }, (response) => {
                            if (response.success) {
                                console.log("Problem Description:", response.value);
                            } else {
                                console.error("Failed to fetch problem description.");
                            }
                        });

                        chrome.runtime.sendMessage({ action: "getEditorValue" }, (response) => {
                            if (response.success) {
                                console.log("Code:", response.value);
                            } else {
                                console.error("Failed to fetch code.");
                            }
                        });

                        observer.disconnect();
                    }
                });

                observer.observe(targetNode, { childList: true, subtree: true });
            },
        });
    }
});

// Handle GitHub authentication
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "github_auth") {
        const getRedirectURL = chrome.identity.getRedirectURL();
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${getRedirectURL}&scope=read:user%20repo`;
        chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
            if (chrome.runtime.lastError || !responseUrl) {
                sendResponse({ error: chrome.runtime.lastError?.message || "Auth failed" });
                return;
            }

            const urlParams = new URLSearchParams(new URL(responseUrl).search);
            const code = urlParams.get("code");

            await axios.post(`${API_URL}/github_access_token`, JSON.stringify({ code: code.toString() }), {
                headers: {
                    'Content-Type': 'application/json',
                }
            }).then((response) => {
                chrome.storage.sync.set({ github_access_token: response.data.access_token }, () => {
                    chrome.sidePanel.close();
                    chrome.runtime.openOptionsPage();
                });
                sendResponse({ success: true, data: response.data });
            }).catch((error) => {
                sendResponse({ error: error.message });
            });
        });

        return true;
    }
});


// Check if the user is authenticated with GitHub
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "is_authenticated") {
        chrome.storage.sync.get("github_access_token", (data) => {
            sendResponse({ authenticated: !!data.github_access_token });
        });
        return true;
    }
});


// 6lmQHVMEBw85sTOy
// giridharrnair