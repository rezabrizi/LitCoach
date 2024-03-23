chrome.action.onClicked.addListener((tab) => {
    if (tab.url && tab.url.includes("leetcode.com/problems/")) {
        chrome.tabs.sendMessage(tab.id, {action: "toggleSidebar"});
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url){
        if (!changeInfo.url.includes("leetcode.com/problems/")) {
            chrome.tabs.sendMessage(tabId, {action: "hideSidebar"});
        } else {
            chrome.tabs.sendMessage(tabId, {action: "resetSidebar"});
        }
    }
});