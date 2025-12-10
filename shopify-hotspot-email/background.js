// const HUBSPOT_PORTAL_ID = "147403835"; //ruhollah
const HUBSPOT_PORTAL_ID = "25621491"; //felgen

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openHubSpot" && request.email) {

    // 1. Encode the email safely
    const encodedEmail = encodeURIComponent(request.email);

    // 2. Build the URL
    const url = `https://app.hubspot.com/contacts/${HUBSPOT_PORTAL_ID}/contact/${encodedEmail}/`;

    // 3. Open in a new FULL window
    browser.windows.create({
      url: url,
      type: "normal" // 'normal' = full window with address bar & tabs
      // state: "maximized" // Optional: Uncomment this line if you want the window to be full screen
    });
  }
});
