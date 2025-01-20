console.log("Background script running!");

const LEETCODE_URL = "https://leetcode.com/problems/";

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
            sendResponse(result ? { success: true, value: result.result } : { success: false });
        });
        return true;
    }
});

// Monitor for submission result changes
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (tab.url?.startsWith(LEETCODE_URL) && changeInfo.status === "complete") {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: () => {
                // Ensure this script runs only once
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
