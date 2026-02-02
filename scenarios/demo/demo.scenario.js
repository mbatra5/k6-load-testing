/**
 * UNIFIED Demo Test Scenario
 * 
 * ONE scenario for all demo test types (smoke, load, stress, spike)
 * Uses demo-urls.json for easy URL configuration
 * Profile selected via DEMO_TYPE environment variable
 * 
 * EASY TO CUSTOMIZE:
 * 1. Edit data/urls/demo-urls.json to change target URL and pages
 * 2. Run with: npm run demo:smoke, demo:load, demo:stress, or demo:spike
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiResponseTime, apiSuccess, apiFailures } from '../../utils/metrics.utils.js';
import { randomItem, randomSleep } from '../../utils/helpers.utils.js';

// Import all demo profiles
import { demoSmokeProfile, demoSmokeOptions } from '../../profiles/demo-smoke.profile.js';
import { demoLoadProfile, demoLoadOptions } from '../../profiles/demo-load.profile.js';
import { demoStressProfile, demoStressOptions } from '../../profiles/demo-stress.profile.js';
import { demoSpikeProfile, demoSpikeOptions } from '../../profiles/demo-spike.profile.js';

// ============================================
// EASY CONFIGURATION - CHANGE THESE!
// ============================================

// Target URL - Testing Rahul Shetty's automation practice sites
const TARGET_URL = 'https://rahulshettyacademy.com';

// Pages to test - Multiple practice pages
const PAGES = [
  '/AutomationPractice/',      // Practice automation page
  '/seleniumPractise/#/'       // GreenKart - shopping cart practice
];

// NOTE: You can also edit data/urls/demo-urls.json for reference,
// but this scenario uses hardcoded values for simplicity and reliability

// Sleep configuration by test type
const sleepConfig = {
  smoke: { min: 1, max: 1 },        // Fixed 1s for smoke
  load: { min: 1, max: 3 },         // 1-3s for load
  stress: { min: 1, max: 2 },       // 1-2s for stress (faster)
  spike: { min: 1, max: 2 }         // 1-2s for spike (faster)
};

// Response time thresholds by test type
const thresholdConfig = {
  smoke: 2000,   // 2s for smoke
  load: 3000,    // 3s for load
  stress: 5000,  // 5s for stress (more lenient)
  spike: 5000    // 5s for spike (more lenient)
};

// ============================================
// DYNAMIC PROFILE SELECTION
// ============================================

const profileMap = {
  smoke: { profile: demoSmokeProfile, options: demoSmokeOptions, name: 'demo_smoke' },
  load: { profile: demoLoadProfile, options: demoLoadOptions, name: 'demo_load' },
  stress: { profile: demoStressProfile, options: demoStressOptions, name: 'demo_stress' },
  spike: { profile: demoSpikeProfile, options: demoSpikeOptions, name: 'demo_spike' }
};

// Get test type from environment (default: load)
const testType = __ENV.DEMO_TYPE || 'load';
const selectedTest = profileMap[testType];

if (!selectedTest) {
  throw new Error(`Invalid DEMO_TYPE: ${testType}. Must be one of: smoke, load, stress, spike`);
}

// ============================================
// TEST CONFIGURATION
// ============================================

export const options = {
  scenarios: {
    [selectedTest.name]: selectedTest.profile
  },
  thresholds: selectedTest.options.thresholds,
  insecureSkipTLSVerify: true  // Skip TLS verification for demo (macOS compatibility)
};

// ============================================
// TEST LOGIC (Shared by all demo types)
// ============================================

export default function () {
  // Pick a random page
  const page = randomItem(PAGES);
  const url = `${TARGET_URL}${page}`;

  // Make HTTP request
  const startTime = Date.now();
  const response = http.get(url, {
    tags: { name: page }
  });
  const duration = Date.now() - startTime;

  // Record metrics
  apiResponseTime.add(duration);

  // Check if request was successful (threshold varies by test type)
  const threshold = thresholdConfig[testType];
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    [`response time < ${threshold / 1000}s`]: (r) => r.timings.duration < threshold
  });

  if (success) {
    apiSuccess.add(1);
  } else {
    apiFailures.add(1);
    console.log(`❌ Failed: ${url} - Status: ${response.status}`);
  }

  // Sleep based on test type
  const sleepTime = sleepConfig[testType];
  sleep(randomSleep(sleepTime.min, sleepTime.max));
}

/**
 * HOW TO CUSTOMIZE:
 * 
 * 1. CHANGE TARGET URL & PAGES:
 *    Edit: data/urls/demo-urls.json
 *    {
 *      "target": "https://example.com",
 *      "pages": ["/", "/about", "/products"]
 *    }
 * 
 * 2. RUN DIFFERENT TEST TYPES:
 *    npm run demo:smoke   # Quick validation (1 min, 10 users)
 *    npm run demo:load    # Gradual ramp (5 min, 0→1000 users)
 *    npm run demo:stress  # Push limits (5 min, 0→1500 users)
 *    npm run demo:spike   # Sudden burst (5 min, 100→1000 users)
 * 
 * 3. ADJUST PROFILES:
 *    Edit files in profiles/demo-*.profile.js to change:
 *    - User counts (target)
 *    - Duration
 *    - Ramp patterns
 */
