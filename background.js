chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.includes("leetcode.com/problems/")) {
        chrome.tabs.sendMessage(tab.id, {action: "toggleSidebar"});
    }
});

const lastProblemUrl = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        // Extract the base problem identifier from the URL
        const problemMatch = changeInfo.url.match(/leetcode\.com\/problems\/([^\/]+)/);
        const currentProblemBase = problemMatch ? problemMatch[1] : null;

        // Check if we have moved to a different problem
        if (currentProblemBase && currentProblemBase !== lastProblemUrl[tabId]) {
            // Update the last problem URL identifier for this tab
            if (!(tabId in lastProblemUrl))
            {
                lastProblemUrl[tabId] = currentProblemBase;
            }
            else{
                lastProblemUrl[tabId] = currentProblemBase;
                chrome.tabs.sendMessage(tabId, {action: "resetSidebar"});
            }
            
        } else if (!currentProblemBase) {
            // If the new URL is not a problem page, hide the sidebar and clear the stored URL for this tab
            delete lastProblemUrl[tabId];
            chrome.tabs.sendMessage(tabId, {action: "hideSidebar"});
        }
    }
});