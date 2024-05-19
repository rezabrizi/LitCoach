console.log("Background script running!");

// Enable the side panel when the action button is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Only enable the side panel on LeetCode problem pages
chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
    if (!tab.url) return;

    const enabled = /^https?:\/\/leetcode\.com\/problems\/[^]+\/$/.test(tab.url);
    await chrome.sidePanel.setOptions({
        tabId,
        path: enabled ? "index.html" : undefined,
        enabled,
    });
});

// Check if the current tab is a LeetCode problem page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "isLeetCodeProblem") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            const isLeetCodeProblem = /^https?:\/\/leetcode\.com\/problems\/[^]+\/$/.test(tab.url);
            sendResponse({ value: isLeetCodeProblem });
        });
        return true;
    }
});

// Get the editor value from the Monaco editor
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getEditorValue") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    world: "MAIN",
                    func: () => window.monaco.editor.getModels()[0].getValue(),
                },
                (results) => {
                    const response = results?.[0]?.result
                        ? { success: true, value: results[0].result }
                        : { success: false, error: chrome.runtime.lastError };
                    sendResponse(response);
                },
            );
        });
        return true;
    }
});

// Get the problem description from the meta tag
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getProblemDescription") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
            chrome.scripting.executeScript(
                {
                    target: { tabId: tab.id },
                    func: () => {
                        const meta = document.querySelector('meta[name="description"]');
                        return meta ? meta.content : null;
                    },
                },
                (results) => {
                    const response = results?.[0]?.result
                        ? { success: true, value: results[0].result }
                        : { success: false, error: chrome.runtime.lastError };
                    sendResponse(response);
                },
            );
        });
        return true;
    }
});