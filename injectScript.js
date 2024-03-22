
// Immediately invoked function express 
(function() {
    try {
      const value = monaco.editor.getModels()[0].getValue();
      window.postMessage({ type: 'FROM_PAGE', text: value }, '*');
    } catch (error) {
      console.error('Error fetching Monaco editor value:', error);
    }
  })();
  