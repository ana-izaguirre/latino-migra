/**
 * Security & Sanitization Utilities for LatinoMigra
 * Prevents XSS, unsafe DOM injection, and unvalidated URI schemes.
 */

const SAFE_IMAGE_PROTOCOLS = ["http:", "https:", "data:"];

/**
 * Validates and sanitizes image URLs to prevent javascript: pseudo-protocols
 * or arbitrary HTML injection via DOM image attributes.
 *
 * Returns an empty string when there is nothing safe to show, so the caller
 * decides what to render instead. The default used to be a stock photograph of
 * a stranger, which every avatar in the product then presented as the
 * visitor's own face (#99).
 */
export function getSafeImageUrl(url?: string | null, fallback = ""): string {
  if (!url || typeof url !== "string") {
    return fallback;
  }

  const trimmed = url.trim();

  // If it's a relative path starting with '/'
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (SAFE_IMAGE_PROTOCOLS.includes(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    // If URL parsing fails, check if it starts with https:// or http://
    if (/^https?:\/\//i.test(trimmed)) {
      return encodeURI(trimmed);
    }
  }

  return fallback;
}

/**
 * Escapes plain text to avoid accidental HTML interpretation in dynamic DOM strings
 */
export function sanitizePlainText(text?: string | null): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
