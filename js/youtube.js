let ENABLE = true;

const PIP_SELECTOR = `button[data-tooltip-target-id="ytp-pip-button"]`;
const MODIFIED_ATTR = `data-gray-ext-modified`;
const VISIBLE_DISPLAY_STYLE = `inline-block`;

const ALTERNATIVE_QUERY = `.ytp-right-controls-right`

const targetNode = document;

let defaultButton = null;

const observerConfig = {
	childList: true,
	subtree: true,
	attributeOldValue: true,
};

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}


async function getActualItem(attempt = 0) {
	let actualItem = Array.from(document.querySelectorAll(`div[class="ytp-menuitem"][role="menuitem"]`)).find(element => element.querySelector(`div[class="ytp-menuitem-label"]`)?.textContent == "Miniplayer");
	if (!actualItem && attempt == 0) {
		let videoEl = document.querySelector("video");
		let rightClick = new MouseEvent('contextmenu', {
			bubbles: true,
			cancelable: true,
			view: window,
			button: 2 // 2 represents the right mouse button
		});
		videoEl.dispatchEvent(rightClick);
		await sleep(100);
		let escKeyEvent = new KeyboardEvent('keydown', {
			key: 'Escape',
			keyCode: 27, // Deprecated, but good for older browser support
			which: 27,   // Deprecated, but good for older browser support
			bubbles: true,
			cancelable: true
		});
		videoEl.dispatchEvent(escKeyEvent);
		// document.querySelector(`div[class="ytp-popup ytp-contextmenu ytp-probably-keyboard-focus"]`).style.display = "none";
		actualItem = await getActualItem(attempt + 1);
	}
	console.log("returning actualitem", actualItem);
	return actualItem;
}

async function completeExistingContent() {
	if (!ENABLE) return;
	let pipbutton = document.querySelector(PIP_SELECTOR);
	if (!pipbutton) return;

	if (pipbutton.getAttribute(MODIFIED_ATTR)) {
		return
	};

	defaultButton = pipbutton;
	let newButton = pipbutton.cloneNode(true);

	newButton.setAttribute(MODIFIED_ATTR, "true");
	newButton.style.display = VISIBLE_DISPLAY_STYLE;

	let alternateParent = document.querySelector(ALTERNATIVE_QUERY);
	if (alternateParent) {
		let idealSvg = alternateParent.querySelector("svg");
		let svg = newButton.querySelector("svg");
		if (svg && idealSvg) {
			let newsvg = idealSvg.cloneNode(false);
			let rect1 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			rect1.setAttribute("x", "8.3%");
			rect1.setAttribute("y", "16.67%");
			rect1.setAttribute("width", "83%");
			rect1.setAttribute("height", "67%");
			rect1.setAttribute("rx", "8.3%");
			rect1.setAttribute("stroke", "#fff");
			rect1.setAttribute("stroke-width", "8.3%");
			rect1.setAttribute("stroke-linecap", "round");
			rect1.setAttribute("stroke-linejoin", "round");
			let rect2 = document.createElementNS("http://www.w3.org/2000/svg", "rect");
			rect2.setAttribute("x", "54.167%");
			rect2.setAttribute("y", "54.167%");
			rect2.setAttribute("width", "37.5%");
			rect2.setAttribute("height", "29%");
			rect2.setAttribute("rx", "8.3%");
			rect2.setAttribute("stroke", "#fff");
			rect2.setAttribute("stroke-width", "8.3%");
			rect2.setAttribute("stroke-linecap", "round");
			rect2.setAttribute("stroke-linejoin", "round");
			newsvg.appendChild(rect1);
			newsvg.appendChild(rect2);
			newButton.replaceChild(newsvg, svg);
		}
		alternateParent.appendChild(newButton);
	} else {
		pipbutton.parentElement.replaceChild(newButton, pipbutton);
	}

	newButton.onclick = async (ev) => {
		ev.preventDefault();
		(await getActualItem()).click();
	};
}

const observer = new MutationObserver(async (mutations, observer) => {
	// if (!ENABLE) return;
	await completeExistingContent();
});

async function reset() {
	let pipbutton = document.querySelector(PIP_SELECTOR);
	if (!pipbutton) return;
	if (ENABLE) {
		// will be handled in complete existing content call
	} else {
		if (pipbutton.getAttribute(MODIFIED_ATTR)) {
			let alternateParent = document.querySelector(ALTERNATIVE_QUERY);
			if (alternateParent) {
				alternateParent.removeChild(pipbutton);
			} else {
				pipbutton.parentElement.replaceChild(defaultButton, pipbutton);
			}
		};
	}
	await completeExistingContent();
}

/**
 * 
 * @param {string[]} keywords 
 * @param {boolean} enabled 
 */
async function update(enabled) {
	ENABLE = enabled;
	await reset();
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
	if (request.type === "state_sync") {
		sendResponse(true);
		await update(request.value.enabled);
	} else {
		sendResponse({ error: "Unknown request type" });
	}
});

function fetchState() {
	chrome.runtime.sendMessage(
		{
			type: "tab_reg",
		},
		(response) => {
			console.log(response);
		}
	);
}

fetchState();

observer.observe(targetNode, observerConfig);
