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

## Key Learnings

- `MutationObserver` essential for SPA menus that load dynamically
- Cross-origin restrictions prevent iframe from accessing parent URL params - must extract order ID from own context
- `target="_top"` breaks out of iframe when navigating
- Case-insensitive, multi-language pattern matching: normalize text to lowercase, check multiple variants
