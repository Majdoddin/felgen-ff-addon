const HUBSPOT_PORTAL_ID = "25621491"; //felgen

// Auto-update configuration
const UPDATE_URL = "https://raw.githubusercontent.com/Majdoddin/felgen-ff-addon/master/updates.json";
const ADDON_ID = "shopify-hubspot-email@majdoddin.com";

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

// Setup alarm to check every 3 minutes
browser.alarms.create("check-update", { periodInMinutes: 3 });

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "check-update") {
    checkVersion();
  }
});

async function checkVersion() {
  try {
    // Cache-busting fetch
    const response = await fetch(`${UPDATE_URL}?t=${Date.now()}`);

    if (!response.ok) {
      console.log(`Update check: updates.json not found (${response.status}). Waiting for first release.`);
      return;
    }

    const data = await response.json();

    // Validate data structure
    if (!data || !data.addons || !data.addons[ADDON_ID] ||
        !data.addons[ADDON_ID].updates || !data.addons[ADDON_ID].updates[0]) {
      console.warn("Update check: Invalid updates.json structure");
      return;
    }

    const latest = data.addons[ADDON_ID].updates[0].version;
    const current = browser.runtime.getManifest().version;

    // Compare versions - only notify if remote is NEWER
    const comparison = compareVersions(latest, current);

    if (comparison > 0) {
      console.log(`New version ${latest} available. Current: ${current}`);
      showUpdateNotification(latest);
    } else if (comparison < 0) {
      console.log(`Update check: Installed version ${current} is newer than remote ${latest}`);
    } else {
      console.log(`Update check: Already on latest version ${current}`);
    }
  } catch (err) {
    console.error("Update check failed:", err);
  }
}

function showUpdateNotification(newVersion) {
  console.log(`Attempting to show notification for v${newVersion}`);

  browser.notifications.create("update-available", {
    "type": "basic",
    "iconUrl": browser.runtime.getURL("icon.png"),
    "title": `Update Available: v${newVersion}`,
    "message": "To update:\n1. Open about:addons\n2. Click gear icon ⚙️\n3. Select 'Check for Updates'"
  }).then((notificationId) => {
    console.log(`Notification created successfully with ID: ${notificationId}`);
  }).catch((error) => {
    console.error(`Failed to create notification:`, error);
  });
}

// Run check on installation or update
browser.runtime.onInstalled.addListener(() => {
  checkVersion();
});

// Run check once on startup
checkVersion();

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
