const ENABLED_TOOGLE = document.getElementById("enabled");
const DARK_MODE = document.getElementById("dark-mode");
const UpdateText = document.getElementById("update-text");

let ENABLED = true;
let DARK_MODE_ENABLED = true;

function updateTheme() {
  if (DARK_MODE_ENABLED) {
    if (!document.body.classList.contains("dark")) document.body.classList.add("dark");
  }
  else {
    document.body.classList.remove("dark");
  }
}


function updateUI() {
  ENABLED_TOOGLE.checked = ENABLED;
  updateTheme();
}

ENABLED_TOOGLE.addEventListener("change", (ev) => {
  ENABLED = ev.target.checked;
  sendState();
});

DARK_MODE.addEventListener("click", () => {
  let isdark = document.body.classList.contains("dark");
  DARK_MODE_ENABLED = !isdark;
  updateTheme();
  sendState();
})

function sendState() {
  chrome.runtime.sendMessage(
    {
      type: "state_set",
      value: { enabled: ENABLED, darkMode: DARK_MODE_ENABLED },
    },
    (response) => {
      console.log(response);
    }
  );
}

function fetchState() {
  chrome.runtime.sendMessage(
    {
      type: "state_get",
    },
    (response) => {
      console.log(response);
    }
  );
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("got message", request, sender, sendResponse);
  if (request.type === "state_sync") {
    sendResponse(true);
    ENABLED = request.value.enabled;
    DARK_MODE_ENABLED = request.value.darkMode;
    updateUI();
  } else {
    sendResponse({ error: "Unknown request type" });
  }
});

chrome.action.onClicked.addListener((tab) => {
  fetchState();
});

fetchState();

async function updateText() {
  let responses = await Promise.all([
    fetch("https://raw.githubusercontent.com/GrayHat12/no-spoilers/refs/heads/main/updates/GENERAL.md"),
    fetch("https://raw.githubusercontent.com/GrayHat12/no-spoilers/refs/heads/main/updates/YTMiniplayer.md"),
  ]);

  let markdownCombined = "";
  for (let response of responses) {
    if (response.status != 200) continue;
    markdownCombined += await response.text();
  }
  UpdateText.innerHTML = DOMPurify.sanitize(marked.parse(markdownCombined));
}

updateText().then(console.log).catch(console.error);
