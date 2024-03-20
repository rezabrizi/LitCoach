// Function to extract problem statement
function getProblemDescription() {
    const metaTag = document.querySelector('meta[name="description"]');
    return metaTag ? metaTag.content : '';
}


function waitForElement(selector, callback) {
    const intervalTime = 100; // Interval check time in milliseconds
    const timeout = 5000; // Timeout in milliseconds
    let elapsedTime = 0;

    const interval = setInterval(() => {
        const element = document.querySelector(selector);
        if (element) {
            clearInterval(interval);
            callback(element);
        } else if (elapsedTime > timeout) {
            clearInterval(interval);
            console.error('Element not found:', selector);
        }
        elapsedTime += intervalTime;
    }, intervalTime);
}

function setupObserver(codeContainer) {
    const observer = new MutationObserver((mutations) => {
        // Extract code whenever a mutation is detected
        const allCode = extractAllCode();
        console.log(allCode); // Logs the current state of the code in the editor
    });

    const config = { childList: true, subtree: true };
    observer.observe(codeContainer, config);

    return observer;
}

function extractAllCode() {
    // Adjusted selector to ensure it selects the intended container
    const codeContainer = document.querySelector('.view-lines.monaco-mouse-cursor-text');
    let allCode = '';

    if (codeContainer) {
        const lines = codeContainer.querySelectorAll('.view-line');
        lines.forEach(line => {
            allCode += line.textContent + '\n';
        });
    }

    return allCode.trim();
}

// Usage
waitForElement('.view-lines.monaco-mouse-cursor-text', (element) => {
    console.log('Code container found, setting up observer...');
    setupObserver(element);
});

