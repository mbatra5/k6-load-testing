/**
 * Browser-Based Page Load Scenario (Dynamic Profile)
 * Uses real Chromium browser to measure actual page load performance
 * 
 * Usage: Set TEST_TYPE environment variable to load different profiles
 *   TEST_TYPE=smoke   → smoke.profile.js (quick validation)
 *   TEST_TYPE=load    → load.profile.js (normal capacity)
 *   TEST_TYPE=stress  → stress.profile.js (above peak)
 *   TEST_TYPE=spike   → spike.profile.js (burst traffic)
 *   TEST_TYPE=soak    → soak.profile.js (extended duration)
 *   TEST_TYPE=local   → local.profile.js (dev testing)
 * 
 * Measures:
 * - Page load time
 * - HTTP request duration
 * - Web Vitals (LCP, FCP, CLS, TTFB)
 * - Success/failure rates
 */

import { browser } from 'k6/browser';
import { check } from 'k6';
import { tagWithCurrentStageIndex } from '../../vendor/k6-utils.js';

import { getBaseUrl, getEnvironmentName } from '../../config/env.config.js';
import { setupAuthenticatedContext } from '../../utils/auth.utils.js';
import { pageLoadTime, mainPageSuccess, mainPageFailures } from '../../utils/metrics.utils.js';
import { randomItem, getPageName } from '../../utils/helpers.utils.js';

// Dynamic profile loading based on TEST_TYPE environment variable
const TEST_TYPE = __ENV.TEST_TYPE || 'load';
const profileModule = await import(`../../profiles/${TEST_TYPE}.profile.js`);
const testProfile = profileModule[`${TEST_TYPE}Profile`];
const testOptions = profileModule[`${TEST_TYPE}Options`];

// Dynamic URL loading based on ENV environment variable
const envName = getEnvironmentName().toLowerCase();
const urlData = JSON.parse(open(`./data/urls/${envName}-urls.json`));
const baseUrl = getBaseUrl();
const endpoints = Object.values(urlData.pages).map(path => baseUrl + path);

export const options = {
  scenarios: {
    browser_page_load: {
      executor: testProfile.executor,
      startVUs: testProfile.startVUs,
      stages: testProfile.stages,
      gracefulRampDown: testProfile.gracefulRampDown,
      options: {
        browser: {
          type: 'chromium'
        }
      }
    }
  },
  thresholds: testOptions.thresholds,
  insecureSkipTLSVerify: true  // Required for macOS
};

export default async function() {
  // Tag metrics with current stage for per-stage thresholds
  tagWithCurrentStageIndex();
  
  // Select random URL from list
  const url = randomItem(endpoints);
  const pageName = getPageName(url, baseUrl);
  
  // Create authenticated browser context
  const context = await setupAuthenticatedContext(browser);
  const page = await context.newPage();
  
  try {
    // Measure page load time
    const start = Date.now();
    const response = await page.goto(url, { waitUntil: 'load' });
    const duration = Date.now() - start;
    
    // Record page load time metric
    pageLoadTime.add(duration, { page: pageName });
    
    // Validate response
    const passed = check(response, {
      'status is 200': (r) => r && r.status() === 200
    }, { page: pageName });
    
    // Record success/failure
    if (passed) {
      mainPageSuccess.add(1, { page: pageName });
    } else {
      mainPageFailures.add(1, { page: pageName });
      console.error(`Failed to load ${url}, status: ${response?.status()}`);
    }
    
  } catch (error) {
    console.error(`Error loading ${url}: ${error.message}`);
    mainPageFailures.add(1, { page: pageName });
  } finally {
    // Clean up
    await page.close();
    await context.close();
  }
}
