/**
 * Response helper
 *
 * Provides a single, safe way to return JSON / text from the JSON-API and
 * webhook code paths. Previously `Response.json(...)` was called all over the
 * controllers but was never defined, which threw `ReferenceError: Response is
 * not defined` and broke every endpoint.
 *
 * Note: the interactive web UI does NOT use this helper — it calls server
 * functions directly via `google.script.run`. This is only for the
 * programmatic JSON endpoints (Cloudflare proxy / Telegram webhook / curl).
 */
var Response = (typeof Response !== 'undefined' && Response) || {};

/**
 * Return a JSON ContentService output.
 * @param {Object} obj - any serializable object
 * @return {GoogleAppsScript.Content.TextOutput}
 */
Response.json = function (obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj || {}))
    .setMimeType(ContentService.MimeType.JSON);
};

/**
 * Return a plain text ContentService output.
 * @param {string} str
 * @return {GoogleAppsScript.Content.TextOutput}
 */
Response.text = function (str) {
  return ContentService
    .createTextOutput(String(str == null ? '' : str))
    .setMimeType(ContentService.MimeType.TEXT);
};
