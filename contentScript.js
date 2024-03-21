function injectCSS() {
    const styleSheet = document.createElement('link');
    styleSheet.href = chrome.runtime.getURL('sidebar.css');
    styleSheet.type = 'text/css';
    styleSheet.rel = 'stylesheet';
    document.head.appendChild(styleSheet);
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
        <button id="my-extension-coach">Get Coach Feedback</button>
        <textarea id="my-extension-coach-feedback" readonly></textarea>
    `;

    document.body.appendChild(sidebar);

    // Adjusting the page layout to accommodate the sidebar
    const mainContent = document.querySelector('#__next');
    if (mainContent) {
        mainContent.style.marginRight = "400px";
    } else {
        document.body.style.marginRight = "400px";
    }

    // Setup toggle button functionality
    setupToggleButtons();

    // Add event listener to the coach feedback button
    document.getElementById('my-extension-coach').addEventListener('click', function() {
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
                const feedback = await getFeedback(problemContext);
                document.getElementById('my-extension-coach-feedback').value = feedback;
            } catch (error) {
                console.error("Error getting feedback: ", error);
                document.getElementById('my-extension-coach-feedback').value = "Error getting feedback.";
            }
        }).catch(error => {
            console.error("Error capturing problem context:", error);
        });
    });
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
        return data.feedback; 
    } catch (error){
        console.error('Error fetching feedback: ', error);
        throw error; 
    }
}

// Function to capture the problem context (problem description and user code)
async function captureProblemContext() {
    let problemContext = {};
    try {
        const problemElement = await waitForElement('meta[name="description"]');
        problemContext.problem = problemElement ? problemElement.content : 'Problem description not found';

        const codeContainer = await waitForElement('.view-lines.monaco-mouse-cursor-text');
        problemContext.userCode = getCode(codeContainer);
    } catch (error) {
        console.error(error);
        throw error; // Rethrow to be caught by the caller
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

// Function to get user code from the code editor
function getCode(codeContainer) {
    let allCode = '';
    if (codeContainer) {
        const lines = codeContainer.querySelectorAll('.view-line');
        lines.forEach(line => {
            allCode += line.textContent + '\n';
        });
    }
    return allCode.trim();
}

// Inject the sidebar when the content script loads
injectSidebar();
