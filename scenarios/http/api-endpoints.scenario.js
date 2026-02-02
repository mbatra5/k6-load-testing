/**
 * HTTP-Only API Endpoints Scenario (Dynamic Profile)
 * Lighter weight testing without browser overhead
 * 
 * Usage: Set TEST_TYPE environment variable to load different profiles
 *   TEST_TYPE=smoke   → smoke.profile.js (quick validation)
 *   TEST_TYPE=load    → load.profile.js (normal capacity)
 *   TEST_TYPE=stress  → stress.profile.js (above peak)
 *   TEST_TYPE=spike   → spike.profile.js (burst traffic)
 *   TEST_TYPE=soak    → soak.profile.js (extended duration)
 * 
 * Use this for:
 * - Higher VU capacity on same hardware
 * - API/endpoint testing
 * - Quick performance checks
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { tagWithCurrentStageIndex } from '../../vendor/k6-utils.js';

import { getBaseUrl, getEnvironmentName } from '../../config/env.config.js';
import { apiResponseTime, apiSuccess, apiFailures } from '../../utils/metrics.utils.js';
import { randomItem, randomSleep } from '../../utils/helpers.utils.js';

// Dynamic profile loading based on TEST_TYPE environment variable
const TEST_TYPE = __ENV.TEST_TYPE || 'load';
const profileModule = await import(`../../profiles/${TEST_TYPE}.profile.js`);
const testProfile = profileModule[`${TEST_TYPE}Profile`];

// Dynamic URL loading based on ENV environment variable
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
      gracefulRampDown: testProfile.gracefulRampDown
    }
  },
  thresholds: {
    'http_req_duration': ['p(95)<1000', 'p(99)<2000', 'avg<500'],
    'http_req_failed': ['rate<0.01'],
    'checks': ['rate>0.99']
  },
  insecureSkipTLSVerify: true  // Required for macOS
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
  
  // Think time: simulate user reading page
  sleep(randomSleep(1, 3));
}
