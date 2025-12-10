document.addEventListener("click", (event) => {
  const target = event.target;

  // Get the text of whatever you just clicked
  const text = target.innerText || target.textContent || "";

  // Regex to find an email address inside that text
  const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/;
  const match = text.match(emailRegex);

  // 1. If we found an email...
  // 2. AND the text isn't huge (prevents accidental triggers when clicking a whole table row)
  if (match && text.length < 300) {

    // Send to background to open HubSpot
    browser.runtime.sendMessage({
      action: "openHubSpot",
      email: match[0]
    });
  }
}, true); // Capture phase (true) ensures we catch the click before Shopify blocks it
