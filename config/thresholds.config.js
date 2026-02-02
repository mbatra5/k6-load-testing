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
 * Based on dry run: p(95)=1.89s, avg=437ms
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
