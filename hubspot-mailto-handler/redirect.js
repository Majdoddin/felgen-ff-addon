// CONFIGURATION
const PORTAL_ID = "1234567"; // PUT YOUR ID HERE

// Get the full dirty URL (e.g., mailto:bob@example.com)
const params = new URLSearchParams(window.location.search);
const rawUrl = params.get('url');

if (rawUrl) {
    // 1. Remove 'mailto:'
    // 2. Remove any subject lines or body text (?subject=...)
    // 3. Decode any weird characters
    let email = decodeURIComponent(rawUrl.replace('mailto:', ''));
    email = email.split('?')[0];

    // Redirect to HubSpot
    //const hubspotUrl = `https://app.hubspot.com/global-search/${PORTAL_ID}?term=${encodeURIComponent(email)}`;
    //const hubspotUrl = `https://mail.google.com/mail/u/0/#search/${encodeURIComponent(email)}`;
    const hubspotUrl = `https://app-eu1.hubspot.com/search/147403835/search?query=${encodeURIComponent(email)}`;
    window.location.replace(hubspotUrl);
} else {
    document.body.innerText = "Error: No email provided.";
}
