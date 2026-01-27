# Shopify Admin Helper Firefox Extension

Multi-feature Firefox extension for Shopify admin customization.

## Project Structure
- `shopify-hotspot-email/` - Main extension directory
- `hubspot-mailto-handler/` - Separate mailto handler addon
- Settings page: `options.html` - toggles for each feature (all default enabled)
- Manifest v2, `all_frames: true` to run in iframes

## Features

1. **HubSpot email handler**: Click email → open HubSpot contact (runs on all admin pages)
2. **Hide menu items**: Removes "Print with Order Printer" + "Packing slips" from order page menus
3. **Lieferschein redirect**: On DPD fulfillment page, click Lieferschein → navigate to order page + auto-open Order Printer modal

## Technical Decisions

### Cross-origin iframes
DPD app runs in `easydpd.247apps.de` iframe. Added to `content_scripts.matches` + `all_frames: true`. Content script runs independently in main page AND each iframe (isolated contexts).

### Link replacement vs modification
Original link had click handlers that override href changes. Solution: Hide original (`display: none`), clone node, update href, insert after. Avoids fighting with app's JS.

### Menu detection
Order Printer location varies (in "Weitere Aktionen" or "Drucken" menu). Solution: Search all buttons, if not found, programmatically click menu buttons ("weitere aktionen"/"more actions"/"drucken"/"print"), then retry search. Handles both German/English dynamically.

### URL hash trigger
Clicking Lieferschein navigates to `/orders/{id}#open-order-printer`. Extension detects hash on page load, triggers auto-open logic, removes hash after success.

### Why not direct modal
Order Printer uses Shopify App Bridge - can't open directly via URL. Must trigger via DOM click to preserve App Bridge context.

### Context-aware hiding
"order printer" appears in both Print section (keep) and More Actions (hide). Solution: Match exact phrase "print with order printer" / "drucken mit order printer" instead of just "order printer".

### SPA navigation handling
Content scripts only run on initial page load, not on Shopify's client-side navigation. Solution: Added URL change detection via MutationObserver. When URL changes, reinitialize page-specific features. Track and disconnect old observers before creating new ones to prevent memory leaks. HubSpot handler runs once globally (event listener persists across navigations).

### Publishing workflow
Use `web-ext sign --channel=unlisted` for self-hosted extensions. Store API credentials in `~/.web-ext-config.mjs` (chmod 600). Produces Mozilla-signed `.xpi` without AMO publication. For auto-updates: add `update_url` to manifest pointing to JSON with version/download link.

## Key Learnings

- `MutationObserver` essential for SPA menus that load dynamically
- Content scripts don't re-run on SPA navigation - must detect URL changes and reinitialize
- Cross-origin restrictions prevent iframe from accessing parent URL params - must extract order ID from own context
- `target="_top"` breaks out of iframe when navigating
- Case-insensitive, multi-language pattern matching: normalize text to lowercase, check multiple variants
- Menu items only exist in DOM when menu is open - hiding happens on-demand, may briefly flash
