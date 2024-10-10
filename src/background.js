console.log("Background script running!");

const leetCodeProblemUrlPrefix = "https://leetcode.com/problems/";

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

// Enable the side panel on LeetCode problem pages
chrome.tabs.onUpdated.addListener(async (tabId, _, { url }) => {
    if (!url) return;
    const enabled = url.startsWith(leetCodeProblemUrlPrefix);
    await chrome.sidePanel.setOptions({ tabId, path: enabled ? "index.html" : undefined, enabled });
});

// Check if the current tab is a LeetCode problem page
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "isLeetCodeProblem") {
        chrome.tabs.query({ active: true, currentWindow: true }, ([{ url }]) =>
            sendResponse({ value: url.startsWith(leetCodeProblemUrlPrefix) }),
        );
        return true;
    }
});

// Get the editor value from the Monaco editor
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.action === "getEditorValue") {
        chrome.tabs.query({ active: true, currentWindow: true }, async ([{ id, url }]) => {
            if (!url.startsWith(leetCodeProblemUrlPrefix)) return sendResponse({ success: false });

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
            if (!url.startsWith(leetCodeProblemUrlPrefix)) return sendResponse({ success: false });

            const [result] = await chrome.scripting.executeScript({
                target: { tabId: id },
                func: () => document.querySelector('meta[name="description"]')?.content || null,
            });
            sendResponse(result ? { success: true, value: result.result } : { success: false });
        });
        return true;
    }
});
