chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "toggleSidebar") {
        console.log("Received the message in content Script!");
        const sidebar = document.getElementById('my-extension-sidebar');
        if (sidebar) {
            // Toggle the .hidden class to show/hide the sidebar
            sidebar.classList.toggle('hidden');
            const isSidebarVisible = !sidebar.classList.contains('hidden');
            toggleMainContent(isSidebarVisible ? "400px" : "0");
        } 
        else {
            injectSidebar();
            toggleMainContent("400px");
        }
    } else if (message.action === "hideSidebar") {
        const sidebar = document.getElementById('my-extension-sidebar');
        if (sidebar && !sidebar.classList.contains('hidden')) {
            var element = document.getElementById('my-extension-coach-feedback-container');
            if (element) {
                element.innerHTML = '';
            }
            sidebar.classList.add('hidden');
            toggleMainContent("0");
        }
    }
    else if (message.action === "resetSidebar") {
        const sidebar = document.getElementById('my-extension-sidebar');
        if (sidebar)
        {
            var element = document.getElementById('my-extension-coach-feedback-container');
            if (element) {
                element.innerHTML = '';
            }
        }
    }
});


function toggleMainContent(margin) {
    const mainContent = document.querySelector('#__next');
    if (mainContent) {
        mainContent.style.marginRight = margin;
    } else {
        document.body.style.marginRight = margin;
    }
}

function injectCSS() {
    if (!document.head.querySelector('link[href="' + chrome.runtime.getURL('sidebar.css') + '"]')) {
        const styleSheet = document.createElement('link');
        styleSheet.href = chrome.runtime.getURL('sidebar.css');
        styleSheet.type = 'text/css';
        styleSheet.rel = 'stylesheet';
        document.head.appendChild(styleSheet);
    }
}

function setupToggleButtons() {
    document.querySelectorAll('.toggle-button').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('active');
        });
    });
}


function injectSidebar() {
    // Inject CSS
    injectCSS();

    // Sidebar HTML with toggle buttons
    const sidebar = document.createElement('div');
    sidebar.id = 'my-extension-sidebar';
    sidebar.innerHTML = `
        <select id="my-extension-coach-type">
            <option value="guide">Guide</option>
            <option value="feedback" selected>Feedback</option>
        </select>
        <div id="my-extension-criteria" class="criteria-container">
            <button class="toggle-button" id="time-complexity-toggle">Time Complexity</button>
            <button class="toggle-button" id="space-complexity-toggle">Space Complexity</button>
            <button class="toggle-button" id="code-conciseness-toggle">Code Conciseness</button>
        </div>
        <button id="my-extension-coach">LitCoach it!</button>
        <div id="my-extension-coach-feedback-container"> </div>
    `;

    document.body.appendChild(sidebar);

    // Setup toggle button functionality
    setupToggleButtons();

    // Add event listener to the coach feedback button
    document.getElementById('my-extension-coach').addEventListener('click', function() {

        document.getElementById('my-extension-coach-feedback-container').innerHTML = '';


        let button = this
        button.disabled = true; 
        let syntaxLoaderInterval = showLoading('my-extension-coach-feedback-container', "Checking syntax", "syntax");

        captureProblemContext().then(async (problemData) => {
            let problemContext = {
                ...problemData,
                coachType: document.getElementById('my-extension-coach-type').value,
                criteria: {
                    timeComplexity: document.getElementById('time-complexity-toggle').classList.contains('active'),
                    spaceComplexity: document.getElementById('space-complexity-toggle').classList.contains('active'),
                    codeConciseness: document.getElementById('code-conciseness-toggle').classList.contains('active'),
                }
            };
    
            try {
                const syntax = await checkSyntax(problemContext);
                clearInterval(syntaxLoaderInterval); // Stop the loading effect for syntax check
                document.getElementById('loadingMessage-syntax').remove();
                let syntaxContainer = document.createElement('div');
            
                if (syntax.syntax === false) {
                    // Display syntax error and solution
                    syntaxContainer.innerHTML = `<div>${syntax.syntax_description}</div><br><pre><code>${syntax.syntax_code}</code></pre>`;
                }
                document.getElementById('my-extension-coach-feedback-container').appendChild(syntaxContainer);
                let spaceAfterSyntax = document.createElement('div');
                spaceAfterSyntax.style.margin = '30px 0';
                document.getElementById('my-extension-coach-feedback-container').appendChild(spaceAfterSyntax);
                
                if (problemContext.coachType === "feedback") {
                    // Now, handle the feedback with a new loading message
                    let feedbackLoaderInterval = showLoading('my-extension-coach-feedback-container', "Getting feedback", "feedback");
                    const feedback = await getFeedback(problemContext);
                    clearInterval(feedbackLoaderInterval); // Stop the loading effect
                    document.getElementById('loadingMessage-feedback').remove(); // Remove this specific loading message
        
                    let feedbackContainer = document.createElement('div');
                    feedbackContainer.innerHTML = `<div>${feedback.feedback}</div>`;
                    document.getElementById('my-extension-coach-feedback-container').appendChild(feedbackContainer);
                }
                else if (problemContext.coachType === "guide"){
                    let guideLoaderInterval = showLoading('my-extension-coach-feedback-container', "Getting guide", "guide");
                    const guide = await getGuide(problemContext);
                    clearInterval(guideLoaderInterval);
                    document.getElementById('loadingMessage-guide').remove(); // Remove this specific loading message

                    let guideContainer = document.createElement('div');

                    // Check if guide is true, then display only the description
                    if (guide.guide === true) {
                        guideContainer.innerHTML = `<div>${guide.guide_description}</div>`;
                    } else {
                        // Guide is false, display description, steps, and code
                        let guideSteps = guide.guide_steps;
                        let stepsHtml = '<ol>';
                        for (let step in guideSteps) {
                            stepsHtml += `<li>${guideSteps[step]}</li>`;
                        }
                        stepsHtml += '</ol>';

                        guideContainer.innerHTML = `
                            <div>${guide.guide_description}</div>
                            ${stepsHtml}
                            <pre><code>${guide.guide_code}</code></pre>
                        `;
                    }

                    document.getElementById('my-extension-coach-feedback-container').appendChild(guideContainer);
                }

                
    
            } catch (error) {
                console.error("Error getting feedback: ", error);
                clearInterval(syntaxLoaderInterval);
                document.getElementById('my-extension-coach-feedback-container').textContent += "\nError getting feedback.";
            } finally {
                button.disabled = false;
            }
        }).catch(error => {
            console.error("Error capturing problem context:", error);
            clearInterval(syntaxLoaderInterval);
            document.getElementById('my-extension-coach-feedback-container').textContent += "\nError capturing problem context.";
            button.disabled = false; 
        });
    });
}

function showLoading(containerId, message, uniqueSuffix) {
    let dots = 0;
    const loadingDiv = document.createElement('div');
    loadingDiv.id = `loadingMessage-${uniqueSuffix}`; // Unique ID
    loadingDiv.textContent = message;
    document.getElementById(containerId).appendChild(loadingDiv);
    
    return setInterval(() => {
        dots = (dots + 1) % 4;
        loadingDiv.textContent = message + ".".repeat(dots);
    }, 500);
}



async function checkSyntax(problemContext){
    try{
        const response = await fetch ('http://127.0.0.1:5000/api/syntax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(problemContext)
        }); 

        if(!response.ok){
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); 
        return data; 
    } catch(error) {
        console.error('Error checking syntax: ', error); 
        throw error; 
    }
}


async function getFeedback(problemContext){
    try{
        const response = await fetch('http://127.0.0.1:5000/api/feedback', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(problemContext),
        });

        if(!response.ok){
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); 
        return data; 
    } catch (error){
        console.error('Error fetching feedback: ', error);
        throw error; 
    }
}

async function getGuide(problemContext){
    try{
        const response = await fetch('http://127.0.0.1:5000/api/guide', {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(problemContext),
        });

        if(!response.ok){
            throw new Error('Network response was not ok');
        }

        const data = await response.json(); 
        return data; 
    } catch (error){
        console.error('Error fetching feedback: ', error);
        throw error; 
    }
}

// This function injects a script to capture the code from Monaco Editor using an external script file
function injectScriptToCaptureCode() {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL('injectScript.js'); // Load the script from the extension
    (document.head || document.documentElement).appendChild(script);
    script.onload = function() {
        this.remove();
    };
}

  
  // Modified captureProblemContext to use the new method
async function captureProblemContext() {
    let problemContext = {};
    try {
        // Capture the problem description
        const problemElement = await waitForElement('meta[name="description"]');
        problemContext.problem = problemElement ? problemElement.content : 'N/A';

        injectScriptToCaptureCode();
        problemContext.userCode = await new Promise((resolve, reject) => {
        const listener = function(event) {
            if (event.source != window || !event.data.type || event.data.type != 'FROM_PAGE') {
            return;
            }
            window.removeEventListener('message', listener);
            resolve(event.data.text);
        };
        window.addEventListener('message', listener);
        // Timeout as a fallback in case the code cannot be captured
        setTimeout(() => {
            window.removeEventListener('message', listener);
            reject(new Error('Timeout waiting for code from Monaco Editor'));
        }, 5000);
        });

    } catch (error) {
        console.error("Error capturing problem context:", error);
        problemContext.userCode = 'N/A'; // Default value in case of error
    }
    return problemContext;
}
  


// Utility function to wait for an element to appear in the DOM
function waitForElement(selector) {
    return new Promise((resolve, reject) => {
        const intervalTime = 100;
        const timeOut = 5000;
        let elapsedTime = 0;

        const interval = setInterval(() => {
            const element = document.querySelector(selector);
            if (element) {
                clearInterval(interval);
                resolve(element);
            } else if (elapsedTime > timeOut) {
                clearInterval(interval);
                reject(new Error('Element not found: ' + selector));
            }
            elapsedTime += intervalTime;
        }, intervalTime);
    });
}

