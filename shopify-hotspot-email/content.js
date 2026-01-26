// Load settings and initialize features
browser.storage.sync.get({
  enableHubspot: true,
  hideOrderPrinter: true,
  redirectLieferschein: true
}).then((settings) => {

  // Feature 1: HubSpot Email Handler
  if (settings.enableHubspot) {
    initHubspotEmailHandler();
  }

  // Feature 2: Hide Order Printer (only on order pages)
  if (settings.hideOrderPrinter && isOrderPage()) {
    initOrderPrinterHider();
  }

  // Feature 2b: Auto-open Order Printer overlay if hash is present
  if (isOrderPage() && window.location.hash === '#open-order-printer') {
    initOrderPrinterAutoOpen();
  }

  // Feature 3: Redirect Lieferschein links (only on DPD fulfillment pages)
  if (settings.redirectLieferschein && isDpdFulfillmentPage()) {
    initLieferscheinRedirect();
  }
});

// Check if current page is an order page
function isOrderPage() {
  return /\/orders\/\d+/.test(window.location.pathname);
}

// Check if current page is a DPD fulfillment page
function isDpdFulfillmentPage() {
  // Check if we're on the DPD domain (inside iframe) or on Shopify admin with DPD app path
  return window.location.hostname === 'easydpd.247apps.de' ||
         /\/apps\/dpd-versand-services\/fulfillments\/create/.test(window.location.pathname);
}

// Initialize HubSpot email click handler
function initHubspotEmailHandler() {
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
}

// Initialize Order Printer menu item hider
function initOrderPrinterHider() {
  // Function to hide Order Printer menu items
  function hideOrderPrinterItems() {
    // Find all menu items (Shopify uses various selectors, this covers most cases)
    const menuItems = document.querySelectorAll('[role="menuitem"], button, a');

    menuItems.forEach(item => {
      const text = (item.innerText || item.textContent || '').toLowerCase();

      // Check for items to hide (case-insensitive)
      const shouldHide =
        text.includes('print with order printer') ||        // English: Order Printer app
        text.includes('drucken mit order printer') ||       // German: Order Printer app
        text.includes('lieferscheine drucken') ||           // German: Packing slips
        text.includes('packing slip');                       // English: Packing slips (note: could be "slips" plural too)

      if (shouldHide) {
        // Hide the item completely
        item.style.display = 'none';

        // Also hide parent list item if it exists
        const listItem = item.closest('li');
        if (listItem) {
          listItem.style.display = 'none';
        }
      }
    });
  }

  // Run immediately
  hideOrderPrinterItems();

  // Watch for DOM changes (Shopify loads menus dynamically)
  const observer = new MutationObserver(() => {
    hideOrderPrinterItems();
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Initialize Lieferschein link redirect
function initLieferscheinRedirect() {
  // Extract order ID from current URL
  function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  // Function to replace Lieferschein links
  function replaceLieferscheinLinks() {
    const orderId = getOrderIdFromUrl();

    if (!orderId) {
      return; // No order ID in URL, can't redirect
    }

    // Find all links
    const links = document.querySelectorAll('a');

    links.forEach(link => {
      const text = (link.innerText || link.textContent || '').toLowerCase();

      // Check if link text contains "lieferschein" (case-insensitive)
      // and hasn't been replaced yet
      if (text.includes('lieferschein') && !link.hasAttribute('data-replaced')) {
        // Extract store name from current URL
        const storeMatch = window.location.pathname.match(/\/store\/([^\/]+)/);
        const storeName = storeMatch ? storeMatch[1] : 'deinfelgendoktor';

        // Build new URL - navigate to order page with special hash
        const newUrl = `https://admin.shopify.com/store/${storeName}/orders/${orderId}#open-order-printer`;

        // Hide the original link
        link.style.display = 'none';

        // Mark as replaced to avoid duplicates
        link.setAttribute('data-replaced', 'true');

        // Create new link with same styling
        const newLink = link.cloneNode(true);
        newLink.href = newUrl;
        newLink.setAttribute('target', '_top'); // Break out of iframe
        newLink.removeAttribute('rel');
        newLink.style.display = ''; // Show it

        // Insert new link after the original
        link.parentNode.insertBefore(newLink, link.nextSibling);
      }
    });
  }

  // Run immediately
  replaceLieferscheinLinks();

  // Watch for DOM changes (DPD page loads content dynamically)
  const observer = new MutationObserver(() => {
    replaceLieferscheinLinks();
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Auto-open Order Printer overlay on order page
function initOrderPrinterAutoOpen() {
  let menuOpened = false;

  // Function to find and click Order Printer menu item
  function clickOrderPrinterMenuItem() {
    // First, try to find the Order Printer item directly (might be visible already)
    const allElements = document.querySelectorAll('button, a, [role="menuitem"]');

    for (const element of allElements) {
      const text = (element.innerText || element.textContent || '').toLowerCase();

      // Look for "Order Printer" menu item (not "Print with Order Printer")
      if (text.includes('order printer') && !text.includes('print with') && !text.includes('drucken mit')) {
        console.log('[Shopify Extension] Found Order Printer menu item, clicking...');
        element.click();

        // Remove the hash from URL
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return true;
      }
    }

    // If not found and we haven't opened a menu yet, try opening menus
    if (!menuOpened) {
      // Look for "Weitere Aktionen" (More Actions) or "Drucken" (Print) buttons
      for (const element of allElements) {
        const text = (element.innerText || element.textContent || '').toLowerCase().trim();

        // Check for menu buttons (case-insensitive, various languages)
        if (text === 'weitere aktionen' || text === 'more actions' ||
            text === 'drucken' || text === 'print') {
          console.log('[Shopify Extension] Opening menu:', text);
          element.click();
          menuOpened = true;
          return false; // Don't stop - menu is now opening, need to wait and try again
        }
      }
    }

    return false;
  }

  // Try immediately
  if (clickOrderPrinterMenuItem()) {
    return;
  }

  // Keep trying with delays
  let attempts = 0;
  const maxAttempts = 20; // 10 seconds total

  const checkInterval = setInterval(() => {
    attempts++;

    if (clickOrderPrinterMenuItem()) {
      clearInterval(checkInterval);
      return;
    }

    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.log('[Shopify Extension] Could not find Order Printer menu item after', maxAttempts, 'attempts');
    }
  }, 500);
}
