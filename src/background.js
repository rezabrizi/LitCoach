console.log("Background script running!");

const leetCodeProblemUrlPrefix = "https://leetcode.com/problems/";

// Enable the side panel when the action button is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Only enable the side panel on LeetCode problem pages
chrome.tabs.onUpdated.addListener(async (tabId, _, tab) => {
    if (!tab.url) return;

    const enabled = tab.url.startsWith(leetCodeProblemUrlPrefix);
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
            const isLeetCodeProblem = tab.url.startsWith(leetCodeProblemUrlPrefix);
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
                    func: () => {
                        const isPremium =
                            document.querySelector(".text-brand-orange")?.textContent.trim() === "Premium";
                        return window.monaco.editor.getModels()[isPremium ? 0 : 1].getValue();
                    },
                },
                (results) => {
                    const [result] = results || [];
                    sendResponse(
                        result.result !== null ? { success: true, value: result.result } : { success: false },
                    );
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
                    sendResponse(
                        results?.[0]?.result ? { success: true, value: results[0].result } : { success: false },
                    );
                },
            );
        });
        return true;
    }
});
