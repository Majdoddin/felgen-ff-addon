const HUBSPOT_PORTAL_ID = "25621491"; //felgen

// Auto-update configuration
const MANIFEST_URL = "https://raw.githubusercontent.com/Majdoddin/felgen-ff-addon/master/updates.json";
const ADDON_ID = "shopify-hubspot-email@majdoddin.com";
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

async function signalUpdateCheck() {
  try {
    // Fetch updates.json with cache-buster
    const response = await fetch(`${MANIFEST_URL}?nocache=${Date.now()}`);
    const data = await response.json();

    // Get latest version from updates.json
    const latestVersion = data.addons[ADDON_ID].updates[0].version;
    const currentVersion = browser.runtime.getManifest().version;

    // Only trigger update check if versions differ
    if (latestVersion !== currentVersion) {
      console.log(`New version ${latestVersion} available. Current: ${currentVersion}`);
      const result = await browser.runtime.requestUpdateCheck();
      console.log("Update check result:", result.status);
    }
  } catch (error) {
    console.error("Update check failed:", error);
  }
}

// Auto-reload when update is downloaded
browser.runtime.onUpdateAvailable.addListener(() => {
  console.log("Update downloaded. Reloading extension...");
  browser.runtime.reload();
});

// Start update checks
setInterval(signalUpdateCheck, CHECK_INTERVAL);
signalUpdateCheck(); // Initial check on startup

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
