// Listen for the DOMContentLoaded event to ensure the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('Coach').addEventListener('click', function() {
        // Correctly use chrome.tabs.query to find the active tab in the current window
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            // Send a message to the content script of the active tab
            chrome.tabs.sendMessage(tabs[0].id, {action: "getProblemContext"}, function(response) {
                // Ensure the response is structured as expected
                if (response && response.problem && response.userCode) {
                    getFeedbackOnCode(response.problem, response.userCode).then(feedback => {
                        showFeedbackToUser(feedback);
                    }).catch(error => {
                        console.error("Error getting feedback:", error);
                    });
                } else {
                    console.error("Invalid response structure:", response);
                }
            });
        });
    });
});

async function getFeedbackOnCode(problem, code) {
    console.log(problem);
    console.log(code);
    // Simulate fetching feedback (replace with actual API call)
    return "TEST FEEDBACK!!!!";
}

function showFeedbackToUser(feedback) {
    document.getElementById('CoachFeedback').value = feedback;
}
