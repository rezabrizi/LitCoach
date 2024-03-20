


function getProblemDescription() {
    const problemDescriptionElement= document.querySelector('meta[name="description"]');
    if (!problemDescriptionElement)
    {
        console.error('Problem description not found');
    }
    return metaTag ? metaTag.content : '';
}

function getUserCode() {
    // There should be a better way of doign this query selector but for now this is fine
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


function waitForElement (selector, callback) {
    const intervalTime = 100; 
    const timeOut = 5000; 
    let elpasedTime = 0; 

    const interval = setInterval(()=>{
        const element = document.querySelector(selector);
        if (element){
            clearInterval(interval); 
            callback(element);
        } 
        else if (elpasedTime > timeOut){
            clearInterval(interval);
            console.error('Element not found: ', selector);
        }
        elpasedTime += intervalTime; 
    }, intervalTime); 
}

function setupCodeEditorObserver(codeContainerElement) {
    const observer = new MutationObserver((mutations) => {
        const allCode = extractAllCode();
        console.log(allCode); 
    });

    const config = { childList: true, subtree: true };
    observer.observe(codeContainerElement, config);

    return observer;
}



// Usage
waitForElement('.view-lines.monaco-mouse-cursor-text', (element) => {
    console.log('Code container found, setting up observer...');
    setupObserver(element);
});

