console.log("🔧 Popup script loaded");

const { GITHUB_TOKEN, GITHUB_USERNAME, GITHUB_REPO } = DOTPUSH_CONFIG;

// Listen for incoming messages (code + URL)
chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.type === "leetcode-code") {
    console.log("📥 Received code from page:", request.code);
    pushToGitHub(request.code, request.url);
  }
});

//When the button is clicked, inject the scraper
document.getElementById("push-btn").addEventListener("click", () => {
  console.log("▶️ Push? button clicked");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    console.log("👉 injecting scraper into tab", tabs[0].id);
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: scrapeAndSendCode,
    }).catch(err => console.error("Inject failed:", err));
  });
});

//Runs in the LeetCode page context: scrapes code + URL, sends it back
function scrapeAndSendCode() {
    console.log("scrapeAndSendCode running");
  
    let code = "";
  
    //Try Monaco's hidden <textarea> (it contains the full text)
    const hiddenTA = document.querySelector("textarea.inputarea");
    if (hiddenTA) {
      code = hiddenTA.value;
      console.log("Grabbed code via hidden textarea");
    }
    // Only goes here right now because I haven't figured out how to get the Monaco editor to work
    // Fallback — you’ll only ever get visible lines
    else {
      const lines = document.querySelectorAll(".view-lines > .view-line");
      code = Array.from(lines).map(l => l.textContent).join("\n");
      console.log("Grabbed code via DOM (only visible lines!)");
    }
  
    const url = window.location.href;
    chrome.runtime.sendMessage({ type: "leetcode-code", code, url });
  }
  
  
  

// Pushes to GitHub, using the slug from the URL to name the file
function pushToGitHub(code, url) {
    console.log("pushToGitHub()", { code, url });
  
    const slug     = getProblemSlug(url);              // e.g. "two-sum"
    const fileName = `${slug}.py`;
    const path     = `leetcode/${fileName}`;
    const token    = GITHUB_TOKEN;
    const apiUrl   = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${path}`;
    const contentB64 = btoa(unescape(encodeURIComponent(code)));
  
    // Check if file already exists (to get its SHA)
    fetch(apiUrl, {
      headers: { Authorization: `token ${token}` }
    })
      .then(res => {
        if (res.ok) {
          return res.json().then(data => ({ exists: true, sha: data.sha }));
        }
        if (res.status === 404) {
          return { exists: false };
        }
        throw new Error(`GitHub API returned ${res.status}`);
      })
  
      // Build and send the PUT
      .then(({ exists, sha }) => {
        const message = exists
          ? `updated ${slug} solution`
          : `Add solution for ${slug}`;
  
        const body = {
          message,
          content: contentB64,
          branch: "main",
          // only include sha when updating
          ...(exists ? { sha } : {})
        };
  
        return fetch(apiUrl, {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
      })
  
      // check result
      .then(res => res.json())
      .then(data => {
        if (data.content) {
          console.log(`File pushed: ${data.content.path}`);
        } else {
          console.error("GitHub API error:", data);
        }
      })
  
      .catch(err => console.error("Network/API error:", err));
}
  

// Helper to extract the problem slug from the URL
function getProblemSlug(url) {
  const m = url.match(/leetcode\.com\/problems\/([^\/]+)/);
  return m ? m[1] : "solution";
}
