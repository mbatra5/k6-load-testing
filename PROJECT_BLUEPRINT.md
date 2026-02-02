# K6 Load Testing Framework - Project Blueprint

**Complete Recreation Guide & Technical Specification**

Version: 1.0.0  
Last Updated: February 1, 2026  
Build Time: ~2-3 hours

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step-by-Step Setup](#step-by-step-setup)
3. [Complete File Implementations](#complete-file-implementations)
4. [Testing & Validation](#testing--validation)
5. [Troubleshooting Guide](#troubleshooting-guide)
6. [Technical Specifications](#technical-specifications)

---

## Prerequisites

### Required Software

| Tool | Minimum Version | Purpose | Installation |
|------|----------------|---------|--------------|
| **Node.js** | 18.0.0+ | Report generation, cookie setup | `brew install node` (macOS) |
| **Go** | 1.20+ | Building custom k6 with extensions | `brew install go` (macOS) |
| **Git** | 2.0+ | Version control | Pre-installed on macOS/Linux |
| **npm** | 9.0+ | Package management | Comes with Node.js |

### Verify Installation

```bash
node --version   # Should show v18+
go version       # Should show go1.20+
git --version    # Should show 2.0+
```

### System Requirements

- **OS:** macOS, Linux, or Windows (WSL recommended)
- **RAM:** 8 GB minimum (16 GB recommended for high-VU tests)
- **CPU:** 4 cores minimum (8 cores recommended)
- **Disk:** 500 MB for project + reports

---

## Step-by-Step Setup

### Phase 1: Project Initialization

```bash
# Create project directory
mkdir k6-load-testing
cd k6-load-testing

# Initialize npm project
npm init -y

# Update package.json to use ES6 modules
```

**Edit package.json:**
```json
{
  "name": "k6-load-testing",
  "version": "1.0.0",
  "description": "K6 load testing framework with xk6-dashboard HTML reporting",
  "type": "module",
  "keywords": ["k6", "load-testing", "performance-testing", "xk6-dashboard"],
  "author": "",
  "license": "ISC"
}
```

```bash
# Install dependencies
npm install --save-dev cross-env playwright rimraf
```

---

### Phase 2: Build Custom k6 with Dashboard Extension

```bash
# Install xk6 (k6 extension builder)
go install go.k6.io/xk6/cmd/xk6@latest

# Verify xk6 is in PATH
xk6 version

# Build custom k6 with xk6-dashboard extension
xk6 build --with github.com/grafana/xk6-dashboard@latest

# This creates ./k6 binary in current directory
# Verify build
./k6 version

# Expected output:
# k6 v0.49.0 (go1.21.5, darwin/arm64)
# Extensions: github.com/grafana/xk6-dashboard v0.7.2
```

**Note:** The `./k6` binary is specific to this project and includes the dashboard extension.

---

### Phase 3: Create Directory Structure

```bash
# Create all directories
mkdir -p config
mkdir -p data/urls
mkdir -p profiles
mkdir -p scenarios/browser
mkdir -p scenarios/http
mkdir -p scenarios/demo
mkdir -p utils
mkdir -p scripts
mkdir -p templates
mkdir -p vendor
mkdir -p docs
mkdir -p reports

# Create placeholder for git
touch reports/.gitkeep
```

**Final structure:**
```
k6-load-testing/
├── config/
├── data/urls/
├── profiles/
├── scenarios/
│   ├── browser/
│   ├── http/
│   └── demo/
├── utils/
├── scripts/
├── templates/
├── vendor/
├── docs/
└── reports/
```

---

### Phase 4: Configuration Files

#### File 1: `config/env.config.js`

**Purpose:** Environment URL mappings and accessor functions.

**Complete implementation:**

```javascript
/**
 * Environment Configuration
 * Maps environment names to base URLs - mirrors qa-automation pattern
 */

export const environments = {
  PREPROD: 'https://preprod-bp.navitas.bpglobal.com',
  STAGING: 'https://staging-bp.navitas.bpglobal.com',
  CANARY: 'https://canary-bp.navitas.bpglobal.com',
  RELEASE: 'https://release-bp.navitas.bpglobal.com',
  BETA: 'https://beta-bp.navitas.bpglobal.com',
  PROD: 'https://www.bp.com'
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
```

**Key Points:**
- Uses `__ENV` (k6 global variable)
- Supports direct URLs: `ENV=https://feature-branch.com`
- Falls back to PREPROD if not specified

---

#### File 2: `config/thresholds.config.js`

**Purpose:** Centralized pass/fail criteria for all test types.

**Complete implementation:**

```javascript
/**
 * Centralized Threshold Configurations
 * Based on dry run results and production requirements
 */

/**
 * Local development thresholds (lenient for local machine)
 */
export const localThresholds = {
  'browser_http_req_duration': ['p(95)<4000', 'avg<3500'],
  'browser_http_req_failed': ['rate<0.01'],
  'page_load_time': ['p(95)<20000', 'avg<15000'],
  'checks': ['rate>0.99']
};

/**
 * Smoke test thresholds (very lenient - just checking functionality)
 */
export const smokeThresholds = {
  'http_req_duration': ['p(95)<2000', 'avg<1000'],
  'http_req_failed': ['rate<0.05'],
  'checks': ['rate>0.95']
};

/**
 * Load test thresholds (production-like conditions)
 */
export const loadThresholds = {
  'browser_http_req_duration{stage:0}': ['p(95)<4000', 'avg<3500'],
  'browser_http_req_duration{stage:1}': ['p(95)<4000', 'avg<3500'],
  'browser_http_req_duration{stage:2}': ['p(95)<4000', 'p(99)<4200', 'avg<3500'],
  'browser_http_req_duration{stage:3}': ['p(95)<4200', 'p(99)<4500', 'avg<4000'],
  'browser_http_req_duration{stage:4}': ['p(95)<4000', 'avg<3500'],
  'browser_http_req_failed{stage:0}': ['rate<0.01'],
  'browser_http_req_failed{stage:1}': ['rate<0.01'],
  'browser_http_req_failed{stage:2}': ['rate<0.02'],
  'browser_http_req_failed{stage:3}': ['rate<0.03'],
  'browser_http_req_failed{stage:4}': ['rate<0.01'],
  'page_load_time{stage:0}': ['p(95)<6000', 'avg<6000'],
  'page_load_time{stage:1}': ['p(95)<7000', 'avg<7000'],
  'page_load_time{stage:2}': ['p(95)<7000', 'avg<7000'],
  'page_load_time{stage:3}': ['p(95)<7000', 'avg<7000'],
  'page_load_time{stage:4}': ['p(95)<8000', 'avg<7000'],
  'checks{stage:0}': ['rate>0.99'],
  'checks{stage:1}': ['rate>0.99'],
  'checks{stage:2}': ['rate>0.98'],
  'checks{stage:3}': ['rate>0.97'],
  'checks{stage:4}': ['rate>0.99']
};

/**
 * Stress test thresholds (more lenient - expect some degradation)
 */
export const stressThresholds = {
  'browser_http_req_duration': ['p(95)<8000', 'p(99)<10000'],
  'browser_http_req_failed': ['rate<0.05'],
  'page_load_time': ['p(95)<12000'],
  'checks': ['rate>0.90']
};

/**
 * HTTP-only thresholds (faster, no browser overhead)
 */
export const httpThresholds = {
  'http_req_duration': ['p(95)<1000', 'p(99)<2000', 'avg<500'],
  'http_req_failed': ['rate<0.01'],
  'checks': ['rate>0.99']
};
```

**Threshold Syntax:**
- `p(95)<2000`: 95th percentile must be under 2000ms
- `avg<1000`: Average must be under 1000ms
- `rate<0.01`: Rate must be under 1% (for failures)
- `rate>0.95`: Rate must be above 95% (for successes)

---

### Phase 5: Utility Modules

#### File 3: `utils/metrics.utils.js`

**Purpose:** Custom k6 metrics for tracking specific KPIs.

```javascript
/**
 * Custom Metrics Definitions
 * Centralized metrics for tracking specific KPIs
 */

import { Counter, Trend, Rate } from 'k6/metrics';

/**
 * Page load time (full page load including all resources)
 */
export const pageLoadTime = new Trend('page_load_time', true);

/**
 * Counter for main page failures
 */
export const mainPageFailures = new Counter('main_page_failures');

/**
 * Counter for main page successes
 */
export const mainPageSuccess = new Counter('main_page_success');

/**
 * Overall error rate
 */
export const errorRate = new Rate('error_rate');

/**
 * API response time (for HTTP scenarios)
 */
export const apiResponseTime = new Trend('api_response_time', true);

/**
 * API success counter
 */
export const apiSuccess = new Counter('api_success');

/**
 * API failure counter
 */
export const apiFailures = new Counter('api_failures');
```

**Metric Types:**
- `Trend`: For timing data (calculates min, max, avg, percentiles)
- `Counter`: For counting events (incrementing values)
- `Rate`: For success/failure ratios (percentage)

---

#### File 4: `utils/helpers.utils.js`

**Purpose:** Generic helper functions for scenarios.

```javascript
/**
 * Helper Utilities
 * Reusable functions for test scenarios
 */

/**
 * Get random item from array
 * Used for random URL selection
 */
export function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Sleep for random duration (simulates user think time)
 * @param {number} min - Minimum seconds
 * @param {number} max - Maximum seconds
 */
export function randomSleep(min, max) {
  const duration = Math.random() * (max - min) + min;
  return duration;
}

/**
 * Get current timestamp in ISO format
 */
export function timestamp() {
  return new Date().toISOString();
}

/**
 * Extract page name from URL
 * @param {string} url - Full URL
 * @param {string} baseUrl - Base URL to remove
 */
export function getPageName(url, baseUrl) {
  return url.replace(baseUrl, '') || '/';
}

/**
 * Log message with timestamp
 */
export function log(message) {
  console.log(`[${timestamp()}] ${message}`);
}
```

---

#### File 5: `utils/auth.utils.js`

**Purpose:** Load cookies and set up authenticated browser context.

```javascript
/**
 * Authentication Utilities
 * Cookie management and browser context setup
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load cookies from cookies.json file
let allCookies = [];

const cookiesPath = resolve(__dirname, 'cookies.json');
if (existsSync(cookiesPath)) {
  try {
    const cookiesData = readFileSync(cookiesPath, 'utf8');
    allCookies = JSON.parse(cookiesData);
  } catch (error) {
    console.warn('Failed to load cookies.json:', error.message);
  }
}

/**
 * Get all authentication cookies
 * @returns {Array} Array of cookie objects
 */
export function getAuthCookies() {
  return allCookies;
}

/**
 * Setup authenticated browser context with cookies
 * Used in browser-based scenarios
 * 
 * @param {object} browser - k6 browser instance
 * @returns {object} Browser context with cookies
 */
export async function setupAuthenticatedContext(browser) {
  const context = await browser.newContext();
  
  if (allCookies.length > 0) {
    await context.addCookies(allCookies);
  }
  
  return context;
}

/**
 * Check if auth cookies are available
 * @returns {boolean}
 */
export function hasAuthCookies() {
  return allCookies.length > 0;
}
```

---

#### File 6: `utils/cookies-setup.js`

**Purpose:** Playwright automation to capture authentication cookies.

```javascript
#!/usr/bin/env node

/**
 * Cookie Setup Script
 * Uses Playwright to generate authentication cookies
 * Saves cookies to utils/cookies.json for use in k6 tests
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const TARGET_URL = 'https://preprod-bp.navitas.bpglobal.com';  // Change to your URL
const COOKIES_OUTPUT = resolve(__dirname, 'cookies.json');

async function setupCookies() {
  console.log('🔧 Starting Playwright browser...');
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  console.log(`🌐 Navigating to: ${TARGET_URL}`);
  await page.goto(TARGET_URL);
  
  console.log('\n⏸️  MANUAL STEP REQUIRED:');
  console.log('   1. Log in to the application in the browser window');
  console.log('   2. Complete any 2FA/verification steps');
  console.log('   3. Press ENTER in this terminal when login is complete\n');
  
  // Wait for user confirmation
  await new Promise(resolve => {
    process.stdin.once('data', () => resolve());
  });
  
  // Get all cookies
  const cookies = await context.cookies();
  
  // Save to file
  writeFileSync(COOKIES_OUTPUT, JSON.stringify(cookies, null, 2));
  
  console.log(`✅ Cookies saved to: ${COOKIES_OUTPUT}`);
  console.log(`📊 Total cookies: ${cookies.length}`);
  
  await browser.close();
  console.log('✅ Setup complete! You can now run authenticated tests.');
}

setupCookies().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
```

**Usage:** `npm run cookies-setup`

---

### Phase 6: Profile Files

Create all 10 profile files following this pattern:

#### Template: Framework Profile

**File:** `profiles/{type}.profile.js`

```javascript
/**
 * {Type} Test Profile
 * {Description of test purpose}
 * 
 * Purpose: {What this test validates}
 * Duration: {Duration}
 * VUs: {VU range}
 */

import { {type}Thresholds } from '../config/thresholds.config.js';

export const {type}Profile = {
  executor: '{executor-type}',  // 'constant-vus' or 'ramping-vus'
  startVUs: 1,  // Optional: for ramping-vus
  vus: 10,      // For constant-vus
  duration: '1m',  // For constant-vus
  stages: [     // For ramping-vus
    { duration: '2m', target: 100 },
    { duration: '5m', target: 500 },
    // ...
  ],
  gracefulRampDown: '30s'  // Optional: cleanup period
};

export const {type}Options = {
  thresholds: {type}Thresholds
};
```

#### Specific Profiles to Create:

**1. profiles/smoke.profile.js:**
```javascript
import { smokeThresholds } from '../config/thresholds.config.js';

export const smokeProfile = {
  executor: 'constant-vus',
  vus: 5,
  duration: '1m'
};

export const smokeOptions = {
  thresholds: smokeThresholds
};
```

**2. profiles/load.profile.js:**
```javascript
import { loadThresholds } from '../config/thresholds.config.js';

export const loadProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '10m', target: 200 },
    { duration: '20m', target: 800 },
    { duration: '20m', target: 1200 },
    { duration: '20m', target: 2400 },
    { duration: '20m', target: 100 }
  ],
  gracefulRampDown: '1m'
};

export const loadOptions = {
  thresholds: loadThresholds
};
```

**3. profiles/stress.profile.js:**
```javascript
import { stressThresholds } from '../config/thresholds.config.js';

export const stressProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '5m', target: 500 },
    { duration: '10m', target: 1200 },
    { duration: '15m', target: 2400 },
    { duration: '20m', target: 3000 },
    { duration: '10m', target: 100 }
  ],
  gracefulRampDown: '1m'
};

export const stressOptions = {
  thresholds: stressThresholds
};
```

**4. profiles/spike.profile.js:**
```javascript
import { stressThresholds } from '../config/thresholds.config.js';

export const spikeProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '2m', target: 100 },
    { duration: '30s', target: 2000 },
    { duration: '5m', target: 2000 },
    { duration: '1m', target: 100 },
    { duration: '5m', target: 100 }
  ],
  gracefulRampDown: '30s'
};

export const spikeOptions = {
  thresholds: stressThresholds
};
```

**5. profiles/soak.profile.js:**
```javascript
import { loadThresholds } from '../config/thresholds.config.js';

export const soakProfile = {
  executor: 'constant-vus',
  vus: 500,
  duration: '4h'
};

export const soakOptions = {
  thresholds: loadThresholds
};
```

**6. profiles/local.profile.js:**
```javascript
import { localThresholds } from '../config/thresholds.config.js';

export const localProfile = {
  executor: 'ramping-vus',
  startVUs: 2,
  stages: [
    { duration: '3m', target: 5 },
    { duration: '9m', target: 10 },
    { duration: '3m', target: 2 }
  ],
  gracefulRampDown: '30s'
};

export const localOptions = {
  thresholds: localThresholds
};
```

**7-10. Demo Profiles:**

Copy the pattern above but:
- Prefix exports with `demo`: `demoSmokeProfile`, `demoSmokeOptions`
- Reduce VU counts (10-200 max)
- Shorter durations (1-5 min)
- Add metadata export: `demoSmokeMetadata` with `{ purpose, pattern, description, timeline }`

**Example demo-smoke.profile.js:**
```javascript
import { smokeThresholds } from '../config/thresholds.config.js';

export const demoSmokeProfile = {
  executor: 'constant-vus',
  vus: 10,
  duration: '1m'
};

export const demoSmokeOptions = {
  thresholds: smokeThresholds
};

export const demoSmokeMetadata = {
  purpose: 'Quick validation with constant load',
  pattern: 'Constant load - 10 concurrent users for 1 minute',
  description: 'Validates basic system health and ensures all critical endpoints respond correctly.',
  timeline: [
    {
      phase: 'Execution',
      duration: '1 minute',
      load: '10 concurrent users',
      objective: 'Verify all endpoints return 200 status codes and response times are reasonable'
    }
  ]
};
```

**Create:** `demo-smoke.profile.js`, `demo-load.profile.js`, `demo-stress.profile.js`, `demo-spike.profile.js`

---

### Phase 7: Scenario Files

#### File 11: `scenarios/browser/page-load.scenario.js`

**Purpose:** Browser-based testing with real Chromium browser.

**Complete implementation:**

```javascript
/**
 * Browser-Based Page Load Scenario (Dynamic Profile)
 * Uses real Chromium browser to measure actual page load performance
 */

import { browser } from 'k6/browser';
import { check } from 'k6';
import { tagWithCurrentStageIndex } from '../../vendor/k6-utils.js';
import { getBaseUrl, getEnvironmentName } from '../../config/env.config.js';
import { setupAuthenticatedContext } from '../../utils/auth.utils.js';
import { pageLoadTime, mainPageSuccess, mainPageFailures } from '../../utils/metrics.utils.js';
import { randomItem, getPageName } from '../../utils/helpers.utils.js';

// Dynamic profile loading
const TEST_TYPE = __ENV.TEST_TYPE || 'load';
const profileModule = await import(`../../profiles/${TEST_TYPE}.profile.js`);
const testProfile = profileModule[`${TEST_TYPE}Profile`];
const testOptions = profileModule[`${TEST_TYPE}Options`];

// Dynamic URL loading
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
      vus: testProfile.vus,
      duration: testProfile.duration,
      gracefulRampDown: testProfile.gracefulRampDown,
      options: {
        browser: {
          type: 'chromium'
        }
      }
    }
  },
  thresholds: testOptions.thresholds,
  insecureSkipTLSVerify: true
};

export default async function() {
  tagWithCurrentStageIndex();
  
  const context = await setupAuthenticatedContext(browser);
  const page = await context.newPage();
  
  const url = randomItem(endpoints);
  const startTime = Date.now();
  
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    pageLoadTime.add(loadTime);
    mainPageSuccess.add(1);
    
    check(page, {
      'page loaded': () => page.url().includes(getPageName(url, baseUrl))
    });
  } catch (error) {
    mainPageFailures.add(1);
  } finally {
    await page.close();
  }
}
```

---

#### File 12: `scenarios/http/api-endpoints.scenario.js`

**Purpose:** HTTP-only testing for high VU capacity.

**Complete implementation:**

```javascript
/**
 * HTTP-Only API Endpoints Scenario (Dynamic Profile)
 * Lighter weight testing without browser overhead
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { tagWithCurrentStageIndex } from '../../vendor/k6-utils.js';
import { getBaseUrl, getEnvironmentName } from '../../config/env.config.js';
import { apiResponseTime, apiSuccess, apiFailures } from '../../utils/metrics.utils.js';
import { randomItem, randomSleep } from '../../utils/helpers.utils.js';

// Dynamic profile loading
const TEST_TYPE = __ENV.TEST_TYPE || 'load';
const profileModule = await import(`../../profiles/${TEST_TYPE}.profile.js`);
const testProfile = profileModule[`${TEST_TYPE}Profile`];

// Dynamic URL loading
const envName = getEnvironmentName().toLowerCase();
const urlData = JSON.parse(open(`./data/urls/${envName}-urls.json`));
const baseUrl = getBaseUrl();
const endpoints = Object.values(urlData.pages).map(path => baseUrl + path);

export const options = {
  scenarios: {
    http_api_test: {
      executor: testProfile.executor,
      startVUs: testProfile.startVUs,
      stages: testProfile.stages,
      vus: testProfile.vus,
      duration: testProfile.duration,
      gracefulRampDown: testProfile.gracefulRampDown
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000', 'avg<500'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.99']
  },
  insecureSkipTLSVerify: true
};

export default function() {
  tagWithCurrentStageIndex();
  
  const url = randomItem(endpoints);
  const start = Date.now();
  
  const response = http.get(url, {
    headers: {
      'User-Agent': 'k6-load-test'
    }
  });
  
  const duration = Date.now() - start;
  apiResponseTime.add(duration);
  
  const passed = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000
  });
  
  passed ? apiSuccess.add(1) : apiFailures.add(1);
  
  sleep(randomSleep(1, 3));
}
```

---

#### File 13: `scenarios/demo/demo.scenario.js`

**Purpose:** Unified demo scenario for all 4 demo test types.

**Complete implementation:**

```javascript
/**
 * UNIFIED Demo Test Scenario
 * ONE scenario for all demo test types (smoke, load, stress, spike)
 * Profile selected via DEMO_TYPE environment variable
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

// Configuration
const TARGET_URL = 'https://rahulshettyacademy.com';
const PAGES = [
  '/AutomationPractice/',
  '/seleniumPractise/#/'
];

// Sleep configuration by test type
const sleepConfig = {
  smoke: { min: 1, max: 1 },
  load: { min: 1, max: 3 },
  stress: { min: 1, max: 2 },
  spike: { min: 1, max: 2 }
};

// Select profile based on DEMO_TYPE
const demoType = __ENV.DEMO_TYPE || 'smoke';
const profileMap = {
  smoke: { exec: 'default', ...demoSmokeProfile },
  load: { exec: 'default', ...demoLoadProfile },
  stress: { exec: 'default', ...demoStressProfile },
  spike: { exec: 'default', ...demoSpikeProfile }
};

const optionsMap = {
  smoke: demoSmokeOptions,
  load: demoLoadOptions,
  stress: demoStressOptions,
  spike: demoSpikeOptions
};

export const options = {
  scenarios: {
    [`demo_${demoType}`]: profileMap[demoType]
  },
  thresholds: optionsMap[demoType].thresholds
};

export default function() {
  const url = TARGET_URL + randomItem(PAGES);
  const start = Date.now();
  
  const response = http.get(url);
  const duration = Date.now() - start;
  
  apiResponseTime.add(duration);
  
  const passed = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 2s': (r) => r.timings.duration < 2000
  });
  
  passed ? apiSuccess.add(1) : apiFailures.add(1);
  
  const sleepTime = sleepConfig[demoType] || sleepConfig.smoke;
  sleep(randomSleep(sleepTime.min, sleepTime.max));
}
```

---

### Phase 8: Data Files

Create URL configuration files for each environment:

#### Template: Environment URL File

**File:** `data/urls/{env}-urls.json`

```json
{
  "target": "https://{env}-bp.navitas.bpglobal.com",
  "pages": {
    "homepage": "/",
    "products": "/products",
    "checkout": "/checkout",
    "about": "/about"
  }
}
```

#### Specific Files to Create:

**1. data/urls/preprod-urls.json:**
```json
{
  "target": "https://preprod-bp.navitas.bpglobal.com",
  "pages": {
    "homepage": "/",
    "blog": "/blog",
    "careers": "/careers",
    "products": "/products"
  }
}
```

**2. data/urls/canary-urls.json:**
```json
{
  "target": "https://canary-bp.navitas.bpglobal.com",
  "pages": {
    "homepage": "/"
  }
}
```

**3-6. Create similar files for:**
- `staging-urls.json`
- `release-urls.json`
- `beta-urls.json`
- `demo-urls.json` (use `https://rahulshettyacademy.com`)

---

### Phase 9: Report Generation Scripts

#### File 14: `scripts/profile-metadata.js`

**Purpose:** Narrative descriptions for executive summary timelines.

```javascript
/**
 * Profile Metadata for Executive Summary Reports
 * Provides narrative descriptions of test phases in non-technical language
 */

export const profileMetadata = {
  'demo-smoke': {
    purpose: 'Quick validation with constant load',
    pattern: 'Constant load - 10 concurrent users for 1 minute',
    description: 'Validates basic system health and ensures all critical endpoints respond correctly.',
    timeline: [
      {
        phase: 'Execution',
        duration: '1 minute',
        load: '10 concurrent users',
        objective: 'Verify all endpoints return 200 status codes and response times are reasonable'
      }
    ]
  },
  
  'demo-load': {
    purpose: 'Capacity testing with gradual ramp-up',
    pattern: 'Ramping load - 0 to 200 users over 5 minutes',
    description: 'Tests system capacity by gradually increasing concurrent users from 0 to 200.',
    timeline: [
      {
        phase: 'Ramp Up',
        duration: '2 minutes',
        load: '0 → 50 users',
        objective: 'Warm up system, establish baseline performance'
      },
      {
        phase: 'Peak Load',
        duration: '2 minutes',
        load: '50 → 200 users',
        objective: 'Test system at expected peak capacity'
      },
      {
        phase: 'Cool Down',
        duration: '1 minute',
        load: '200 → 0 users',
        objective: 'Observe system recovery and resource cleanup'
      }
    ]
  },
  
  'demo-stress': {
    purpose: 'Stress testing to identify breaking point',
    pattern: 'Ramping stress - 0 to 200 users with aggressive ramp',
    description: 'Pushes system beyond normal capacity to identify limits and degradation patterns.',
    timeline: [
      {
        phase: 'Aggressive Ramp',
        duration: '3 minutes',
        load: '0 → 200 users',
        objective: 'Rapidly increase load to stress system resources'
      },
      {
        phase: 'Sustained Stress',
        duration: '1 minute',
        load: '200 users',
        objective: 'Maintain peak stress to observe sustained performance'
      },
      {
        phase: 'Recovery',
        duration: '1 minute',
        load: '200 → 0 users',
        objective: 'Verify system recovers gracefully from stress'
      }
    ]
  },
  
  'demo-spike': {
    purpose: 'Spike testing for sudden traffic bursts',
    pattern: 'Spike pattern - sudden burst to 200 users',
    description: 'Simulates sudden traffic spike (flash sale, viral event) to test system resilience.',
    timeline: [
      {
        phase: 'Normal Load',
        duration: '1 minute',
        load: '10 users',
        objective: 'Establish baseline with normal traffic'
      },
      {
        phase: 'Sudden Spike',
        duration: '30 seconds',
        load: '10 → 200 users',
        objective: 'Rapid traffic increase to simulate burst event'
      },
      {
        phase: 'Sustained Spike',
        duration: '2 minutes',
        load: '200 users',
        objective: 'Maintain spike load to test autoscaling and caching'
      },
      {
        phase: 'Recovery',
        duration: '1.5 minutes',
        load: '200 → 10 users',
        objective: 'Return to normal and verify system stability'
      }
    ]
  }
};
```

**Add entries for all production test types:** `smoke`, `load`, `stress`, `spike`, `soak`, `local`, `api-smoke`, `api-load`, `api-stress`.

---

#### File 15: `scripts/generate-executive-summary.js`

**Purpose:** Parse k6 JSON output and generate non-technical HTML report.

**Key sections (full file is 455 lines, showing critical parts):**

```javascript
#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { profileMetadata } from './profile-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment mapping (mirrors env.config.js for Node.js runtime)
const environments = {
  PREPROD: 'https://preprod-bp.navitas.bpglobal.com',
  STAGING: 'https://staging-bp.navitas.bpglobal.com',
  CANARY: 'https://canary-bp.navitas.bpglobal.com',
  RELEASE: 'https://release-bp.navitas.bpglobal.com',
  BETA: 'https://beta-bp.navitas.bpglobal.com',
  PROD: 'https://www.bp.com'
};

const jsonFile = process.argv[2];
const outputFile = process.argv[3];
const technicalReportPath = process.argv[4] || '';

// Parse k6 NDJSON output
const data = readFileSync(jsonFile, 'utf8');
const lines = data.trim().split('\n');
const metrics = {};
const points = [];

lines.forEach(line => {
  const item = JSON.parse(line);
  if (item.type === 'Point') {
    points.push({
      time: new Date(item.data.time),
      metric: item.metric,
      value: item.data.value,
      tags: item.data.tags || {}
    });
  }
});

// Calculate statistics
function calcStats(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    p50: sorted[Math.floor(values.length * 0.5)],
    p90: sorted[Math.floor(values.length * 0.9)],
    p95: sorted[Math.floor(values.length * 0.95)],
    p99: sorted[Math.floor(values.length * 0.99)]
  };
}

// Extract metrics
const httpReqDuration = points.filter(p => p.metric === 'http_req_duration').map(p => p.value);
const httpReqFailed = points.filter(p => p.metric === 'http_req_failed').map(p => p.value);

const durationStats = calcStats(httpReqDuration);
const totalRequests = httpReqDuration.length;
const failedRequests = httpReqFailed.filter(v => v === 1).length;
const successRate = ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2);

// Generate 10 key findings in plain English
const findings = [];

// 1. Success Rate
if (successRate >= 99) {
  findings.push(`Excellent success rate of ${successRate}%`);
} else if (successRate >= 95) {
  findings.push(`Good success rate of ${successRate}%`);
} else {
  findings.push(`Success rate of ${successRate}% needs improvement`);
}

// 2. Average Response Time
const avgResponseTime = Math.round(durationStats.avg);
if (avgResponseTime < 100) {
  findings.push(`Outstanding average response time of ${avgResponseTime}ms`);
} else if (avgResponseTime < 500) {
  findings.push(`Excellent average response time of ${avgResponseTime}ms`);
} else {
  findings.push(`Average response time of ${avgResponseTime}ms`);
}

// ... 8 more findings (p95, consistency, throughput, capacity, errors, stability, headroom, peak)

// Determine target URL
let targetUrl = '';
if (!targetUrl && process.env.ENV) {
  const env = process.env.ENV;
  targetUrl = env.startsWith('http') ? env : (environments[env] || 'Test Target');
}
if (!targetUrl) {
  targetUrl = 'Test Target';
}

// Load template and populate
const templatePath = resolve(__dirname, '../templates/executive-summary.html');
let template = readFileSync(templatePath, 'utf8');

template = template.replaceAll('{{TEST_NAME}}', testName);
template = template.replaceAll('{{TARGET_URL}}', targetUrl);
template = template.replaceAll('{{SUCCESS_RATE}}', successRate + '%');
// ... all other placeholders

writeFileSync(outputFile, template);
console.log(`✅ Executive summary generated: ${outputFile}`);
```

**Full file:** See existing implementation (455 lines).

---

### Phase 10: HTML Template

#### File 16: `templates/executive-summary.html`

**Purpose:** HTML template for executive summary reports.

**Structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{{TEST_NAME}} - Executive Summary</title>
  <style>
    /* Modern, clean styling */
    body { font-family: system-ui, -apple-system, sans-serif; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    .status-passed { color: #27ae60; }
    .status-warning { color: #f39c12; }
    .status-failed { color: #e74c3c; }
    /* ... more styles */
  </style>
</head>
<body>
  <div class="header">
    <h1>{{TEST_NAME}}</h1>
    <div class="status-badge {{STATUS_CLASS}}">{{STATUS_TEXT}}</div>
  </div>
  
  <section class="overview">
    <h2>Test Overview</h2>
    <div class="info-grid">
      <strong>Date:</strong> {{TEST_DATE}}<br>
      <strong>Target:</strong> {{TARGET_URL}}<br>
      <strong>Duration:</strong> {{DURATION}}<br>
    </div>
  </section>
  
  <section class="metrics">
    <h2>Key Metrics</h2>
    <div class="metric-card">
      <div class="metric-value">{{SUCCESS_RATE}}</div>
      <div class="metric-label">Success Rate</div>
    </div>
    <!-- More metric cards -->
  </section>
  
  <section class="timeline">
    <h2>Test Execution Timeline</h2>
    {{STAGES}}
  </section>
  
  <section class="findings">
    <h2>Key Findings</h2>
    <ul>{{FINDINGS}}</ul>
  </section>
  
  <section class="recommendations">
    <h2>Recommendations</h2>
    <ul>{{RECOMMENDATIONS}}</ul>
  </section>
  
  <section class="conclusion">
    <h2>Conclusion</h2>
    <p>{{CONCLUSION}}</p>
  </section>
  
  <footer>
    <a href="{{TECHNICAL_REPORT_PATH}}">View Technical Report</a>
    <span>Generated: {{GENERATED_TIME}}</span>
  </footer>
</body>
</html>
```

**Placeholders:** Use `{{PLACEHOLDER}}` syntax for dynamic content.

---

### Phase 11: Vendor Files

#### File 17: `vendor/k6-utils.js`

**Purpose:** Third-party k6 utilities (stage tagging).

**Download from:** `https://raw.githubusercontent.com/grafana/k6/master/examples/lib/utils.js`

**Or create minimal version:**

```javascript
/**
 * k6 Utility Functions
 * Source: k6 examples
 */

/**
 * Tag metrics with current stage index
 * Only works with ramping-vus executor
 */
export function tagWithCurrentStageIndex() {
  const exec = __ENV.EXECUTOR || 'default';
  
  if (!exec.includes('ramping')) {
    return;  // Not a ramping executor, skip
  }
  
  // Implementation uses k6 internal exec object
  // Full implementation available in k6 repo
}
```

---

### Phase 12: npm Scripts

#### File 18: `package.json` (scripts section)

**Complete scripts implementation:**

```json
{
  "scripts": {
    "// === SETUP ===": "",
    "cookies-setup": "node utils/cookies-setup.js",
    
    "// === DEMO TESTS (Public URLs - Modular) ===": "",
    "demo:smoke:run": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env DEMO_TYPE=smoke ./k6 run --out dashboard=export=reports/demo-smoke-$TIMESTAMP.html --out json=reports/demo-smoke.json scenarios/demo/demo.scenario.js",
    "demo:smoke:report": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && node scripts/generate-executive-summary.js reports/demo-smoke.json reports/demo-smoke-summary-$TIMESTAMP.html demo-smoke-$TIMESTAMP.html",
    "demo:smoke:open": "open $(ls -t reports/demo-smoke-summary-*.html | head -1) && open $(ls -t reports/demo-smoke-*.html | grep -v summary | head -1)",
    "demo:smoke": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env DEMO_TYPE=smoke ./k6 run --out dashboard=export=reports/demo-smoke-$TIMESTAMP.html --out json=reports/demo-smoke.json scenarios/demo/demo.scenario.js && node scripts/generate-executive-summary.js reports/demo-smoke.json reports/demo-smoke-summary-$TIMESTAMP.html demo-smoke-$TIMESTAMP.html && open reports/demo-smoke-summary-$TIMESTAMP.html && open reports/demo-smoke-$TIMESTAMP.html",
    
    "// Repeat pattern for demo:load, demo:stress, demo:spike": "",
    
    "// === BROWSER TESTS (Chrome - Modular) ===": "",
    "test:local:run": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env TEST_TYPE=local ./k6 run --out dashboard=export=reports/local-$TIMESTAMP.html --out json=reports/local.json scenarios/browser/page-load.scenario.js",
    "test:local:report": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env ENV=$ENV node scripts/generate-executive-summary.js reports/local.json reports/local-summary-$TIMESTAMP.html local-$TIMESTAMP.html",
    "test:local:open": "open $(ls -t reports/local-summary-*.html | head -1) && open $(ls -t reports/local-*.html | grep -v summary | head -1)",
    "test:local": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env TEST_TYPE=local ./k6 run --out dashboard=export=reports/local-$TIMESTAMP.html --out json=reports/local.json scenarios/browser/page-load.scenario.js && cross-env ENV=$ENV node scripts/generate-executive-summary.js reports/local.json reports/local-summary-$TIMESTAMP.html local-$TIMESTAMP.html && open reports/local-summary-$TIMESTAMP.html",
    
    "// Repeat pattern for test:smoke, test:load, test:stress, test:spike, test:soak": "",
    
    "// === HTTP API TESTS (Higher VU Capacity - Modular) ===": "",
    "api:smoke:run": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env TEST_TYPE=smoke ./k6 run --out dashboard=export=reports/api-smoke-$TIMESTAMP.html --out json=reports/api-smoke.json scenarios/http/api-endpoints.scenario.js",
    "api:smoke:report": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env ENV=$ENV node scripts/generate-executive-summary.js reports/api-smoke.json reports/api-smoke-summary-$TIMESTAMP.html api-smoke-$TIMESTAMP.html",
    "api:smoke:open": "open $(ls -t reports/api-smoke-summary-*.html | head -1) && open $(ls -t reports/api-smoke-*.html | grep -v summary | head -1)",
    "api:smoke": "TIMESTAMP=$(date +%Y%m%d-%H%M%S) && cross-env TEST_TYPE=smoke ./k6 run --out dashboard=export=reports/api-smoke-$TIMESTAMP.html --out json=reports/api-smoke.json scenarios/http/api-endpoints.scenario.js && cross-env ENV=$ENV node scripts/generate-executive-summary.js reports/api-smoke.json reports/api-smoke-summary-$TIMESTAMP.html api-smoke-$TIMESTAMP.html && open reports/api-smoke-summary-$TIMESTAMP.html",
    
    "// Repeat pattern for api:load, api:stress": "",
    
    "// === UTILITIES ===": "",
    "clean": "rimraf reports/*.html reports/*.json",
    "clean:json": "rimraf reports/*.json",
    "open-reports": "open reports/",
    "help": "echo 'Run tests: npm run demo:smoke | With ENV: ENV=CANARY npm run test:smoke | Open latest: npm run demo:smoke:open'"
  }
}
```

**Pattern:** Every test type has 4 scripts (`:run`, `:report`, `:open`, combined).

---

### Phase 13: Git Configuration

#### File 19: `.gitignore`

```
# Reports (HTML retained locally with timestamps, JSON overwritten)
reports/*.html
reports/*.json
*.log

# Node modules
node_modules/

# Environment files
.env
.env.local

# k6 binary (will be built locally)
k6

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Test results
test-results/

# Cookies (generated by cookies-setup.js, contains sensitive auth data)
utils/cookies.json
```

---

#### File 20: `.env.example`

```bash
# Environment Selection
# Specify which environment to test (PREPROD, CANARY, STAGING, RELEASE, BETA, PROD)
ENV=PREPROD

# Or use direct URL for feature branches
# ENV=https://feature-branch-name.bpglobal.com

# xk6-dashboard Configuration (optional)
DASHBOARD_HOST=127.0.0.1
DASHBOARD_PORT=5665
```

---

### Phase 14: Documentation

#### File 21: `README.md`

**See existing implementation** (1000+ lines covering):
- Quick start guide
- Test type explanations
- Usage examples with ENV variable
- Modular script execution
- Report management
- Customization guide
- CI/CD integration examples
- Troubleshooting
- Best practices

**Key sections:**
1. What is this? (non-technical intro)
2. Features
3. Quick start (10 minutes to first test)
4. Project structure
5. Running tests (demo vs production)
6. Modular execution pattern
7. Report management strategy
8. Understanding results
9. Customizing tests
10. Advanced configuration
11. CI/CD integration
12. Troubleshooting

---

#### File 22: `docs/THEORY.md`

**Purpose:** Explain k6 concepts for newcomers.

**Topics to cover:**
- Virtual Users (VUs) explained
- Executors (constant-vus vs ramping-vus)
- Stages (load pattern phases)
- Thresholds (pass/fail criteria)
- Metrics (built-in vs custom)
- Checks (assertions)
- Think time (sleep between requests)
- Scenarios (test workflows)
- Browser vs HTTP mode differences

**Example section:**

```markdown
## Virtual Users (VUs)

A **Virtual User** is a simulated user running your test script in parallel.

**Example:**
- 1 VU = 1 person visiting your website
- 100 VUs = 100 people visiting simultaneously
- Each VU runs the test script in a loop until test ends

**Important:** VUs are NOT the same as requests per second (RPS).
- 100 VUs making 1 request every 5 seconds = 20 RPS
- 10 VUs making 10 requests per second = 100 RPS

VUs represent concurrent users, RPS represents throughput.
```

---

## Complete File Implementations

### Critical File: Unified Demo Scenario

**Location:** `scenarios/demo/demo.scenario.js`

**Why This Is Important:** This file demonstrates the "unified scenario" pattern - one file handles 4 test types via environment variable.

**Full Implementation (147 lines):**

```javascript
/**
 * UNIFIED Demo Test Scenario
 * ONE scenario for all demo test types (smoke, load, stress, spike)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { apiResponseTime, apiSuccess, apiFailures } from '../../utils/metrics.utils.js';
import { randomItem, randomSleep } from '../../utils/helpers.utils.js';

import { demoSmokeProfile, demoSmokeOptions } from '../../profiles/demo-smoke.profile.js';
import { demoLoadProfile, demoLoadOptions } from '../../profiles/demo-load.profile.js';
import { demoStressProfile, demoStressOptions } from '../../profiles/demo-stress.profile.js';
import { demoSpikeProfile, demoSpikeOptions } from '../../profiles/demo-spike.profile.js';

const TARGET_URL = 'https://rahulshettyacademy.com';
const PAGES = ['/AutomationPractice/', '/seleniumPractise/#/'];

const sleepConfig = {
  smoke: { min: 1, max: 1 },
  load: { min: 1, max: 3 },
  stress: { min: 1, max: 2 },
  spike: { min: 1, max: 2 }
};

const thresholdConfig = {
  smoke: 2000,
  load: 3000,
  stress: 4000,
  spike: 4000
};

// Profile selection
const demoType = __ENV.DEMO_TYPE || 'smoke';
const profileMap = {
  smoke: { exec: 'default', ...demoSmokeProfile },
  load: { exec: 'default', ...demoLoadProfile },
  stress: { exec: 'default', ...demoStressProfile },
  spike: { exec: 'default', ...demoSpikeProfile }
};

const optionsMap = {
  smoke: demoSmokeOptions,
  load: demoLoadOptions,
  stress: demoStressOptions,
  spike: demoSpikeOptions
};

if (!profileMap[demoType]) {
  throw new Error(`Invalid DEMO_TYPE: ${demoType}. Use: smoke, load, stress, or spike`);
}

export const options = {
  scenarios: {
    [`demo_${demoType}`]: profileMap[demoType]
  },
  thresholds: optionsMap[demoType].thresholds
};

export default function() {
  const url = TARGET_URL + randomItem(PAGES);
  const start = Date.now();
  
  const response = http.get(url);
  const duration = Date.now() - start;
  
  apiResponseTime.add(duration);
  
  const currentThreshold = thresholdConfig[demoType];
  const passed = check(response, {
    'status is 200': (r) => r.status === 200,
    [`response time < ${currentThreshold}ms`]: () => duration < currentThreshold
  });
  
  passed ? apiSuccess.add(1) : apiFailures.add(1);
  
  const sleepTime = sleepConfig[demoType];
  sleep(randomSleep(sleepTime.min, sleepTime.max));
}
```

**Key Innovation:** One scenario file replaces 4 separate files (400+ lines → 147 lines).

---

## Testing & Validation

### Verification Checklist

After completing all phases, run these tests in order:

#### 1. Build Verification

```bash
# Verify k6 binary exists and has dashboard extension
./k6 version

# Expected output includes:
# Extensions: github.com/grafana/xk6-dashboard
```

---

#### 2. Demo Test (No Setup Required)

```bash
# Run demo smoke test
npm run demo:smoke

# Expected:
# - Test runs for 1 minute
# - Live dashboard opens at http://127.0.0.1:5665
# - After test completes, 2 HTML reports open:
#   1. reports/demo-smoke-20260201-120000.html (technical dashboard)
#   2. reports/demo-smoke-summary-20260201-120000.html (executive summary)
# - JSON file created: reports/demo-smoke.json
```

**Verify:**
- ✅ Both reports have SAME timestamp
- ✅ Executive summary shows "Test Target" for target URL
- ✅ All checks pass (green)
- ✅ Success rate near 100%

---

#### 3. Test Modular Execution

```bash
# Run test only (no report generation)
npm run demo:load:run

# Check files created
ls -l reports/demo-load*

# Expected:
# - demo-load-20260201-120500.html (dashboard)
# - demo-load.json (data)

# Generate report separately
npm run demo:load:report

# Expected:
# - demo-load-summary-20260201-120510.html (new timestamp!)

# Open latest reports
npm run demo:load:open

# Expected:
# - Opens most recent summary and dashboard
```

---

#### 4. Test Environment Selection

**First, create canary URL file:**

```bash
cat > data/urls/canary-urls.json << 'EOF'
{
  "target": "https://canary-bp.navitas.bpglobal.com",
  "pages": {
    "homepage": "/"
  }
}
EOF
```

**Run test with CANARY environment:**

```bash
ENV=CANARY npm run test:smoke:run

# Expected:
# - k6 loads canary-urls.json
# - Tests https://canary-bp.navitas.bpglobal.com/
# - Creates smoke.json and smoke-{timestamp}.html
```

**Generate report with ENV:**

```bash
ENV=CANARY npm run test:smoke:report

# Expected:
# - Executive summary shows "Target: https://canary-bp.navitas.bpglobal.com"
```

---

#### 5. Test Without ENV (Default Behavior)

```bash
npm run demo:smoke:report

# Expected:
# - Executive summary shows "Target: Test Target" (generic placeholder)
```

---

#### 6. Test Report Accumulation

```bash
# Run same test twice
npm run demo:smoke
# Wait...
npm run demo:smoke

# Check reports folder
ls -l reports/demo-smoke*.html

# Expected:
# - demo-smoke-20260201-120000.html
# - demo-smoke-20260201-120100.html  ← New timestamp
# - demo-smoke-summary-20260201-120000.html
# - demo-smoke-summary-20260201-120100.html  ← New timestamp
# - demo-smoke.json  ← Only one (overwritten)
```

**Verify:** Multiple HTML files accumulate, JSON file is single (latest).

---

#### 7. Test Cleanup

```bash
# Clean all reports
npm run clean

# Verify
ls reports/
# Expected: Only .gitkeep remains

# Clean only JSON
npm run clean:json

# Verify
ls reports/*.json
# Expected: No JSON files
```

---

### Expected Test Results

#### Demo Smoke Test (1 minute):

**Console Output:**
```
✓ status is 200
✓ response time < 2000ms

checks........................: 100.00% ✓ 600 ✗ 0
http_req_duration.............: avg=76ms  p(95)=158ms
http_req_failed...............: 0.00%
http_reqs.....................: 300
iterations....................: 300
vus...........................: 10
```

**Executive Summary:**
- Success Rate: 100%
- Avg Response: ~76ms
- Status: ✅ PASSED
- Key Finding: "Excellent success rate of 100%..."

---

## Troubleshooting Guide

### Issue 1: `xk6: command not found`

**Cause:** xk6 not in PATH after installation.

**Solution:**
```bash
# Find Go bin directory
go env GOPATH

# Add to PATH (add to ~/.zshrc or ~/.bashrc)
export PATH="$PATH:$(go env GOPATH)/bin"

# Reload shell
source ~/.zshrc

# Verify
xk6 version
```

---

### Issue 2: `./k6: permission denied`

**Cause:** k6 binary not executable.

**Solution:**
```bash
chmod +x ./k6
./k6 version
```

---

### Issue 3: Browser Tests Fail on macOS

**Error:** `browser initialization failed`

**Cause:** Chrome/Chromium not installed for k6.

**Solution:**
```bash
# k6 uses bundled browser, but may need system Chrome
# Install Chrome if not present
# Or run HTTP tests instead: npm run api:smoke
```

---

### Issue 4: `MODULE_NOT_FOUND` for Profile

**Error:** `Cannot find module '../../profiles/smok.profile.js'`

**Cause:** Typo in TEST_TYPE or profile file doesn't exist.

**Solution:**
```bash
# Check spelling
echo $TEST_TYPE

# List profiles
ls profiles/

# Ensure file exists: profiles/{TEST_TYPE}.profile.js
```

---

### Issue 5: Target URL Not Populated

**Symptom:** Executive summary shows "Test Target" instead of environment URL.

**Cause:** ENV not passed to report generation script.

**Solution:** Ensure npm script includes `cross-env ENV=$ENV`:
```json
"test:smoke:report": "... cross-env ENV=$ENV node scripts/generate-executive-summary.js ..."
```

---

### Issue 6: Timestamp Mismatch

**Symptom:** `smoke-20260201-120000.html` but `smoke-summary-20260201-120100.html`

**Cause:** Running `:run` and `:report` separately (different timestamps).

**Solution:** Use combined script:
```bash
npm run test:smoke  # Not test:smoke:run + test:smoke:report separately
```

---

### Issue 7: Reports Not Opening Automatically

**Error:** `open: command failed`

**Cause:** macOS `open` command issue (system-level).

**Solution:** Reports are still generated! Open manually:
```bash
npm run open-reports  # Opens reports/ folder
# Or
open reports/demo-smoke-summary-20260201-120000.html
```

---

## Technical Specifications

### Architecture Patterns

#### 1. Dynamic Module Loading

**Pattern:** Runtime profile selection based on environment variable.

**Implementation:**
```javascript
const TEST_TYPE = __ENV.TEST_TYPE || 'load';
const profileModule = await import(`../../profiles/${TEST_TYPE}.profile.js`);
const testProfile = profileModule[`${TEST_TYPE}Profile`];
```

**Requirements:**
- k6 must support ES6 modules (`import`/`export`)
- Top-level `await` supported in k6
- Profile files must follow naming convention

**Benefits:**
- One scenario → many test types
- Add test type without modifying scenario
- Compile-time type checking via naming convention

---

#### 2. Environment-Driven Configuration

**Pattern:** Load URLs from JSON files based on environment name.

**Implementation:**
```javascript
const envName = getEnvironmentName().toLowerCase();  // "canary"
const urlData = JSON.parse(open(`./data/urls/${envName}-urls.json`));
```

**Requirements:**
- URL files must be lowercase: `canary-urls.json`, not `CANARY-urls.json`
- JSON must have `target` and `pages` fields
- `getEnvironmentName()` must return uppercase, converted to lowercase

**Benefits:**
- No hardcoded URLs in code
- Environment-specific URL sets
- Easy to add new environments

---

#### 3. Unified Scenario Pattern

**Pattern:** Single scenario file with profile mapping.

**Implementation:**
```javascript
const profileMap = {
  smoke: { exec: 'default', ...demoSmokeProfile },
  load: { exec: 'default', ...demoLoadProfile }
};

const demoType = __ENV.DEMO_TYPE || 'smoke';
export const options = {
  scenarios: { demo: profileMap[demoType] }
};
```

**Benefits:**
- Eliminates code duplication (4 files → 1 file)
- Consistent test logic across types
- Single maintenance point

**Tradeoff:** Slightly more complex than separate files.

---

### Data Flow Architecture

```mermaid
graph TD
    CLI[CLI Command] --> ENV[ENV Variables]
    ENV --> TIMESTAMP[Generate Timestamp]
    TIMESTAMP --> K6Cmd[k6 run command]
    
    K6Cmd --> LoadScenario[Load scenario.js]
    LoadScenario --> ImportProfile[Import profile dynamically]
    LoadScenario --> LoadURL[Load URL JSON]
    LoadScenario --> ImportUtils[Import utils]
    
    ImportProfile --> Options[Build options object]
    LoadURL --> Options
    ImportUtils --> DefaultFunc[default function]
    
    Options --> K6Runtime[k6 runtime execution]
    DefaultFunc --> K6Runtime
    
    K6Runtime --> Metrics[Collect metrics]
    Metrics --> JSONWriter[Write JSON output]
    Metrics --> DashWriter[Write dashboard HTML]
    
    JSONWriter --> JSONFile[reports/{type}.json]
    DashWriter --> DashHTML[reports/{type}-{ts}.html]
    
    JSONFile --> NodeScript[Node.js report script]
    NodeScript --> ParseJSON[Parse NDJSON]
    ParseJSON --> CalcStats[Calculate statistics]
    CalcStats --> GenFindings[Generate 10 findings]
    GenFindings --> LoadTemplate[Load HTML template]
    LoadTemplate --> Populate[Populate placeholders]
    Populate --> SummaryHTML[reports/{type}-summary-{ts}.html]
```

---

### Report Generation Algorithm

**Input:** k6 JSON output (NDJSON format - one JSON object per line)

**Processing Steps:**

1. **Parse NDJSON:**
   ```javascript
   const lines = data.trim().split('\n');
   lines.forEach(line => {
     const item = JSON.parse(line);
     if (item.type === 'Point') {
       points.push({ time, metric, value, tags });
     }
   });
   ```

2. **Extract Metrics:**
   ```javascript
   const httpReqDuration = points
     .filter(p => p.metric === 'http_req_duration')
     .map(p => p.value);
   ```

3. **Calculate Statistics:**
   ```javascript
   const sorted = [...values].sort((a, b) => a - b);
   const p95 = sorted[Math.floor(values.length * 0.95)];
   const avg = values.reduce((a, b) => a + b, 0) / values.length;
   ```

4. **Generate Findings:** 10 insights based on metric thresholds

5. **Populate Template:** Replace `{{PLACEHOLDERS}}` with calculated values

6. **Write Output:** HTML file with embedded CSS

**Output:** Self-contained HTML report (no external dependencies).

---

### Timestamp Management Strategy

**Challenge:** Share timestamp between multiple commands in chain.

**Solution:** Generate once in shell, reuse via `$TIMESTAMP` variable.

**Implementation:**
```bash
# Shell script level (npm script)
TIMESTAMP=$(date +%Y%m%d-%H%M%S) && \
  ./k6 run --out dashboard=export=reports/test-$TIMESTAMP.html && \
  node scripts/generate-executive-summary.js ... reports/test-summary-$TIMESTAMP.html
```

**Key:** Use `&&` to chain commands in same shell context (preserves variables).

**Result:** Both files have identical timestamps.

---

### Profile Naming Convention

**Critical Convention:** Profile exports MUST match filename pattern.

**Pattern:**
- **Filename:** `{type}.profile.js`
- **Exports:** `{type}Profile`, `{type}Options`

**Examples:**
| Filename | Must Export |
|----------|-------------|
| `smoke.profile.js` | `smokeProfile`, `smokeOptions` |
| `load.profile.js` | `loadProfile`, `loadOptions` |
| `demo-smoke.profile.js` | `demoSmokeProfile`, `demoSmokeOptions` |

**Why Enforced:** Dynamic import relies on predictable export names:
```javascript
const profileModule = await import(`../../profiles/${TEST_TYPE}.profile.js`);
const testProfile = profileModule[`${TEST_TYPE}Profile`];  // Must exist!
```

**Camelcase Rules:**
- `smoke` → `smokeProfile`
- `demo-smoke` → `demoSmokeProfile` (dash becomes uppercase)

---

### Environment Variable Scoping

**Two Runtime Contexts:**

**1. k6 Runtime (Go-based):**
- Access via: `__ENV.VARIABLE_NAME`
- Passed via: `cross-env TEST_TYPE=smoke ./k6 run ...`
- Available in: Scenarios, profiles (any k6 JavaScript)

**2. Node.js Runtime (JavaScript):**
- Access via: `process.env.VARIABLE_NAME`
- Passed via: `cross-env ENV=CANARY node script.js`
- Available in: Report generation, cookie setup

**Cannot Share:** k6 and Node.js are separate processes with separate environments.

**Solution:** Pass ENV to both:
```bash
cross-env TEST_TYPE=smoke ./k6 run ... && \
cross-env ENV=$ENV node generate-executive-summary.js
```

---

### Report File Format

**k6 JSON Output (NDJSON):**
```json
{"type":"Metric","data":{"name":"http_reqs","type":"counter"},"metric":"http_reqs"}
{"type":"Point","data":{"time":"2026-02-01T12:00:00Z","value":1,"tags":{"status":"200"}},"metric":"http_reqs"}
{"type":"Point","data":{"time":"2026-02-01T12:00:01Z","value":1,"tags":{"status":"200"}},"metric":"http_reqs"}
```

**Format:** Newline-delimited JSON (one object per line).

**Point Object:**
- `type`: "Point" (data point) or "Metric" (metric definition)
- `metric`: Metric name (e.g., "http_req_duration")
- `data.value`: Numeric value
- `data.tags`: Metadata (status, stage, url, etc.)
- `data.time`: ISO timestamp

**Parsing:**
```javascript
const lines = data.trim().split('\n');
const points = lines
  .map(line => JSON.parse(line))
  .filter(item => item.type === 'Point');
```

---

## CI/CD Integration Patterns

### Pattern 1: Modular Execution

**Use separate jobs for test and report:**

```yaml
# Azure Pipelines
- job: RunTest
  steps:
    - script: |
        ENV=CANARY npm run test:smoke:run
      displayName: 'Execute Load Test'
    
    - publish: reports/smoke.json
      artifact: test-data

- job: GenerateReport
  dependsOn: RunTest
  steps:
    - download: current
      artifact: test-data
    
    - script: |
        ENV=CANARY npm run test:smoke:report
      displayName: 'Generate Reports'
    
    - publish: reports/
      artifact: html-reports
```

**Benefits:**
- Test failure doesn't prevent report generation
- Can regenerate reports without re-running tests
- Parallel report generation for multiple test outputs

---

### Pattern 2: Combined Execution

**Use single job with combined script:**

```yaml
# GitHub Actions
- name: Run Load Test
  env:
    ENV: CANARY
  run: npm run test:smoke
  
- name: Upload Reports
  uses: actions/upload-artifact@v3
  with:
    name: k6-reports
    path: reports/*.html
```

**Benefits:**
- Simpler pipeline
- Guaranteed matching timestamps
- Fewer jobs to manage

---

### Pattern 3: Multiple Environments

**Test multiple environments in parallel:**

```yaml
strategy:
  matrix:
    environment: [CANARY, STAGING, PREPROD]

steps:
  - name: Run Tests
    env:
      ENV: ${{ matrix.environment }}
    run: npm run test:smoke
  
  - name: Upload Reports
    uses: actions/upload-artifact@v3
    with:
      name: k6-reports-${{ matrix.environment }}
      path: reports/*.html
```

---

## Advanced Customization Guide

### Custom Executor Configuration

**Available Executors:**

1. **constant-vus:** Fixed number of VUs for duration
   ```javascript
   {
     executor: 'constant-vus',
     vus: 50,
     duration: '10m'
   }
   ```

2. **ramping-vus:** Variable VUs with stages
   ```javascript
   {
     executor: 'ramping-vus',
     startVUs: 0,
     stages: [
       { duration: '5m', target: 100 },
       { duration: '10m', target: 100 },
       { duration: '5m', target: 0 }
     ]
   }
   ```

3. **constant-arrival-rate:** Fixed requests/second
   ```javascript
   {
     executor: 'constant-arrival-rate',
     rate: 100,  // 100 iterations/sec
     timeUnit: '1s',
     duration: '10m',
     preAllocatedVUs: 50
   }
   ```

**When to Use:**
- **constant-vus:** Smoke tests, soak tests
- **ramping-vus:** Load tests, stress tests, spike tests (most common)
- **constant-arrival-rate:** Precise throughput control

---

### Custom Metrics Implementation

**Example:** Track login time separately.

**1. Add to `utils/metrics.utils.js`:**
```javascript
export const loginTime = new Trend('login_time', true);
```

**2. Use in scenario:**
```javascript
import { loginTime } from '../../utils/metrics.utils.js';

export default async function() {
  const start = Date.now();
  
  // Perform login
  await page.fill('#username', 'user');
  await page.fill('#password', 'pass');
  await page.click('#login');
  await page.waitForSelector('#dashboard');
  
  loginTime.add(Date.now() - start);
}
```

**3. Add threshold:**
```javascript
export const smokeOptions = {
  thresholds: {
    ...smokeThresholds,
    'login_time': ['p(95)<3000']  // Login must complete in <3s
  }
};
```

**Result:** Metric appears in all reports automatically.

---

### Custom Checks

**Purpose:** Validate specific conditions beyond HTTP status.

**Example:**
```javascript
check(response, {
  'status is 200': (r) => r.status === 200,
  'has products': (r) => r.json('products').length > 0,
  'response < 500ms': (r) => r.timings.duration < 500,
  'content type is JSON': (r) => r.headers['Content-Type'].includes('application/json')
});
```

**Shows in reports as:**
```
checks: 95.00% ✓ 380 ✗ 20
  ✓ status is 200
  ✓ has products
  ✗ response < 500ms  ← Failed 20 times
  ✓ content type is JSON
```

---

### User Journey Scenarios

**Example:** Multi-step user flow (login → browse → checkout).

```javascript
export default async function() {
  const context = await setupAuthenticatedContext(browser);
  const page = await context.newPage();
  
  // Step 1: Homepage
  await page.goto(baseUrl + '/');
  check(page, { 'homepage loaded': () => page.url().includes('/') });
  sleep(2);
  
  // Step 2: Products
  await page.goto(baseUrl + '/products');
  check(page, { 'products loaded': () => page.url().includes('/products') });
  sleep(3);
  
  // Step 3: Product Detail
  await page.click('.product:first-child');
  check(page, { 'product detail loaded': () => page.url().includes('/product/') });
  sleep(5);
  
  // Step 4: Add to Cart
  await page.click('#add-to-cart');
  check(page, { 'added to cart': () => await page.locator('.cart-count').textContent() === '1' });
  sleep(2);
  
  await page.close();
}
```

**Use For:** Realistic user behavior simulation.

---

## Project Completion Checklist

### Phase 1: Foundation ✅

- [x] npm project initialized
- [x] Dependencies installed (cross-env, playwright, rimraf)
- [x] Custom k6 built with xk6-dashboard
- [x] Directory structure created

### Phase 2: Configuration ✅

- [x] env.config.js (environment mappings)
- [x] thresholds.config.js (pass/fail criteria)
- [x] .gitignore (ignore reports, cookies, k6 binary)
- [x] .env.example (environment variable template)

### Phase 3: Utilities ✅

- [x] metrics.utils.js (custom metrics)
- [x] helpers.utils.js (helper functions)
- [x] auth.utils.js (cookie loading)
- [x] cookies-setup.js (Playwright cookie generator)

### Phase 4: Profiles ✅

- [x] smoke.profile.js
- [x] load.profile.js
- [x] stress.profile.js
- [x] spike.profile.js
- [x] soak.profile.js
- [x] local.profile.js
- [x] demo-smoke.profile.js (with metadata)
- [x] demo-load.profile.js (with metadata)
- [x] demo-stress.profile.js (with metadata)
- [x] demo-spike.profile.js (with metadata)

### Phase 5: Scenarios ✅

- [x] scenarios/browser/page-load.scenario.js (dynamic profile loading)
- [x] scenarios/http/api-endpoints.scenario.js (dynamic profile loading)
- [x] scenarios/demo/demo.scenario.js (unified scenario)

### Phase 6: Data Files ✅

- [x] data/urls/preprod-urls.json
- [x] data/urls/canary-urls.json
- [x] data/urls/staging-urls.json
- [x] data/urls/release-urls.json
- [x] data/urls/beta-urls.json
- [x] data/urls/demo-urls.json

### Phase 7: Report Generation ✅

- [x] scripts/profile-metadata.js (timeline narratives)
- [x] scripts/generate-executive-summary.js (455 lines, 10 findings)
- [x] templates/executive-summary.html (HTML template)

### Phase 8: Vendor ✅

- [x] vendor/k6-utils.js (stage tagging utility)

### Phase 9: npm Scripts ✅

- [x] 13 test types × 4 scripts = 52 scripts
- [x] Modular pattern (`:run`, `:report`, `:open`, combined)
- [x] Timestamp management
- [x] ENV passing

### Phase 10: Documentation ✅

- [x] README.md (1000+ lines, comprehensive)
- [x] docs/THEORY.md (k6 concepts)
- [x] AGENTS.md (this document)
- [x] PROJECT_BLUEPRINT.md (this document)

---

## Quick Recreation Steps (TL;DR)

**For experienced developers who just need the checklist:**

```bash
# 1. Setup
mkdir k6-load-testing && cd k6-load-testing
npm init -y && npm install --save-dev cross-env playwright rimraf

# 2. Build k6
go install go.k6.io/xk6/cmd/xk6@latest
xk6 build --with github.com/grafana/xk6-dashboard@latest

# 3. Create directories
mkdir -p {config,data/urls,profiles,scenarios/{browser,http,demo},utils,scripts,templates,vendor,docs,reports}

# 4. Create all files (use implementations from this document)
# - 2 config files
# - 4 utility files
# - 10 profile files
# - 3 scenario files
# - 2 script files
# - 1 template file
# - 1 vendor file
# - 6 data files
# - 3 documentation files
# - 1 .gitignore
# - 1 .env.example
# - Update package.json (scripts section)

# 5. Test
npm run demo:smoke

# 6. Done!
```

**Total Time:** 2-3 hours (including testing).

---

## Summary

This blueprint provides everything needed to:
1. ✅ Recreate the k6 framework from scratch
2. ✅ Understand architecture and design decisions
3. ✅ Extend with new features
4. ✅ Troubleshoot common issues
5. ✅ Integrate with CI/CD pipelines

**Key Takeaways:**
- Modular architecture (profiles, scenarios, utils separated)
- Dynamic configuration (ENV-driven, no hardcoding)
- Dual reporting (technical + executive)
- Timestamped retention (HTML history, JSON latest)
- Production-ready (tested, documented, maintainable)

**Next Steps:**
- Follow step-by-step setup
- Create all files using provided implementations
- Run verification tests
- Customize for your specific URLs and requirements

**For AI Agents:** Use AGENTS.md for context understanding. Use this blueprint for implementation details.

---

**Blueprint Version:** 1.0.0  
**Framework Version:** 1.0.0 (Phase 1 Complete)  
**Last Validated:** February 1, 2026
