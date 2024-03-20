


// receive data from the contentScript.js
document.addEventListener('DCMContentLoaded', function(){
    document.getElementById('Coach').addEventListener('click', function() {
        chrome.tabs.this.querySelector({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: "getCode"}, function(response) {
                if(response && response.data.problem && response.data.code) {
                    getFeedbackOnCode(response.data.problem, response.data.code).then (feedback => {
                        showFeedbackToUser(feedback);
                    });
                }

            });            
        });
    });
}); 


async function getFeedbackOnCode(problem, code){
    return "TEST Feedback"; 
    // call the backend API
}


function showFeedbackToUser(feedback){
    document.getElementById('CoachFeedback').value = feedback; 
    // update the pop-up page
}

