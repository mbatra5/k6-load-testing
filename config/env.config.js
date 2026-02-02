/**
 * Environment Configuration
 * Maps environment names to base URLs - mirrors qa-automation pattern
 */

export const environments = {
  PREPROD: 'https://preprod.example.com',
  STAGING: 'https://staging.example.com',
  CANARY: 'https://canary.example.com',
  RELEASE: 'https://release.example.com',
  BETA: 'https://beta.example.com',
  PROD: 'https://www.example.com'
};

/**
 * Get base URL from environment variable or default to PREPROD
 * Supports direct URL override for feature branches
 */
export function getBaseUrl() {
  const env = __ENV.ENV || 'PREPROD';
  
  // If env is a full URL (starts with http), use it directly
  if (env.startsWith('http')) {
    return env;
  }
  
  // Otherwise lookup from environments map
  return environments[env] || environments.PREPROD;
}

/**
 * Get current environment name
 */
export function getEnvironmentName() {
  return __ENV.ENV || 'PREPROD';
}
