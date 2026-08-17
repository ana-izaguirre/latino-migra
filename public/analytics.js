// Google Analytics 4 bootstrap.
//
// This lives in its own file rather than inline in index.html so the page can
// enforce a Content-Security-Policy without needing 'unsafe-inline' for
// scripts. Served from the same origin, it is covered by script-src 'self'.
//
// Replace G-MEASUREMENT_ID with the real Google Analytics tracking ID.
window.dataLayer = window.dataLayer || [];
function gtag() {
  dataLayer.push(arguments);
}
gtag("js", new Date());
gtag("config", "G-MEASUREMENT_ID", { page_path: window.location.pathname });
