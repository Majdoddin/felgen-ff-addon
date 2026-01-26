// Load saved settings
browser.storage.sync.get({
  enableHubspot: true,
  hideOrderPrinter: true,
  redirectLieferschein: true
}).then((settings) => {
  document.getElementById('enableHubspot').checked = settings.enableHubspot;
  document.getElementById('hideOrderPrinter').checked = settings.hideOrderPrinter;
  document.getElementById('redirectLieferschein').checked = settings.redirectLieferschein;
});

// Save settings when changed
function saveSettings() {
  const settings = {
    enableHubspot: document.getElementById('enableHubspot').checked,
    hideOrderPrinter: document.getElementById('hideOrderPrinter').checked,
    redirectLieferschein: document.getElementById('redirectLieferschein').checked
  };

  browser.storage.sync.set(settings).then(() => {
    // Show saved status
    const status = document.getElementById('status');
    status.classList.add('show');
    setTimeout(() => {
      status.classList.remove('show');
    }, 2000);
  });
}

// Listen for changes
document.getElementById('enableHubspot').addEventListener('change', saveSettings);
document.getElementById('hideOrderPrinter').addEventListener('change', saveSettings);
document.getElementById('redirectLieferschein').addEventListener('change', saveSettings);
