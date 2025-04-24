document.getElementById("push-btn").addEventListener("click", async () => {
    // Run a script in the active tab to extract code
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: scrapeCodeFromLeetCode,
      });
    });
  });
  
  function scrapeCodeFromLeetCode() {
    const editor = document.querySelector(".monaco-editor");
    if (!editor) {
      console.log("Monaco editor not found");
      return;
    }
  
    const codeLines = document.querySelectorAll(".view-lines > .view-line");
    const code = Array.from(codeLines)
      .map((line) => line.textContent)
      .join("\n");
  
    console.log("Code from editor:\n", code);
  }
  