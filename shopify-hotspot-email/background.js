const HUBSPOT_PORTAL_ID = "25621491"; //felgen

// Auto-update configuration
const MANIFEST_URL = "https://raw.githubusercontent.com/Majdoddin/felgen-ff-addon/master/updates.json";
const ADDON_ID = "shopify-hubspot-email@majdoddin.com";
const CHECK_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes

// Simple version comparison (assumes format like "1.6", "1.7")
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;

    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

async function signalUpdateCheck() {
  try {
    // Fetch updates.json with cache-buster
    const response = await fetch(`${MANIFEST_URL}?nocache=${Date.now()}`);

    // Check if fetch was successful
    if (!response.ok) {
      console.log(`Update check: updates.json not found (${response.status}). Waiting for first release.`);
      return;
    }

    // Parse JSON safely
    const data = await response.json();

    // Validate data structure exists
    if (!data || !data.addons || !data.addons[ADDON_ID] ||
        !data.addons[ADDON_ID].updates || !data.addons[ADDON_ID].updates[0]) {
      console.warn("Update check: Invalid updates.json structure");
      return;
    }

    // Get latest version from updates.json
    const latestVersion = data.addons[ADDON_ID].updates[0].version;
    const currentVersion = browser.runtime.getManifest().version;

    // Compare versions
    const comparison = compareVersions(latestVersion, currentVersion);

    if (comparison > 0) {
      // Remote version is newer
      console.log(`New version ${latestVersion} available. Current: ${currentVersion}`);
      const result = await browser.runtime.requestUpdateCheck();
      console.log("Update check result:", result.status);
    } else if (comparison < 0) {
      // Remote version is older
      console.log(`Update check: Installed version ${currentVersion} is newer than remote ${latestVersion}`);
    } else {
      // Same version
      console.log(`Update check: Already on latest version ${currentVersion}`);
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
