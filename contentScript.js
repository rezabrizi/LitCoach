// Function to extract problem statement
function getProblemStatement() {
    const problemStatement = document.querySelector('SOME_SELECTOR'); // Use the actual selector for the problem statement
    return problemStatement ? problemStatement.innerText : '';
}
  
// Function to monitor and read user's code
function getUserCode() {
const codeEditor = document.querySelector('SOME_SELECTOR'); // Use the actual selector for the code editor
return codeEditor ? codeEditor.value : ''; // or codeEditor.innerText, depending on the element
}

// Use MutationObserver to detect changes in the code editor, or set up a polling mechanism
// This example uses polling for simplicity
setInterval(() => {
const userCode = getUserCode();
console.log(userCode); // For demonstration, replace this with sending the data to your background script or directly using it
}, 1000); // Poll every second, adjust as needed

// Example usage
console.log(getProblemStatement());
  