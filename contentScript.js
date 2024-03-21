function injectCSS() {
    const styleSheet = document.createElement('link');
    styleSheet.href = chrome.runtime.getURL('sidebar.css'); // Adjust the path if your CSS file is in a subdirectory
    styleSheet.type = 'text/css';
    styleSheet.rel = 'stylesheet';
    document.head.appendChild(styleSheet);
}

function injectSidebar() {
    // Sidebar HTML
    injectCSS();

    // Sidebar HTML (Simplified for brevity)
    const sidebar = document.createElement('div');
    sidebar.id = 'my-extension-sidebar';
    sidebar.innerHTML = `
        <button id="my-extension-coach">Get Coach Feedback</button>
        <textarea id="my-extension-coach-feedback" readonly></textarea>
    `;

    document.body.appendChild(sidebar);


    // Adjusting the page layout to accommodate the sidebar
    const mainContent = document.querySelector('#__next'); // Adjust this selector based on your inspection
    if (mainContent) {
        mainContent.style.marginRight = "400px"; // Adjust the margin to make room for the sidebar
    } else {
        // Fallback if no specific main container is identified, or for pages with flexible layouts
        document.body.style.marginRight = "400px";
    }

    // Add event listener to the button
    document.getElementById('my-extension-coach').addEventListener('click', function() {
        captureProblemContext().then(problemContext => {
            console.log('Problem:', problemContext.problem);
            console.log('User Code:', problemContext.userCode);
            const feedback = "YOU CAN'T SOLVE THE PROBLEM BECAUSE YOU ARE A FUCKING DUMBASS!";
            document.getElementById('my-extension-coach-feedback').value = feedback;
        }).catch(error => {
            console.error("Error capturing problem context:", error);
        });
    });
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
