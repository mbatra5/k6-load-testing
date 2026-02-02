/**
 * Generic Helper Utilities
 */

/**
 * Get random element from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random element
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Sleep for random duration between min and max seconds
 * @param {number} min - Minimum seconds
 * @param {number} max - Maximum seconds
 */
export function randomSleep(min, max) {
  const duration = Math.random() * (max - min) + min;
  return duration;
}

/**
 * Format timestamp for logging
 * @returns {string} Formatted timestamp
 */
export function timestamp() {
  return new Date().toISOString();
}

/**
 * Extract page name from URL
 * @param {string} url - Full URL
 * @param {string} baseUrl - Base URL to remove
 * @returns {string} Page path or '/'
 */
export function getPageName(url, baseUrl) {
  return url.replace(baseUrl, '') || '/';
}

/**
 * Log with timestamp
 * @param {string} message - Message to log
 */
export function log(message) {
  console.log(`[${timestamp()}] ${message}`);
}
