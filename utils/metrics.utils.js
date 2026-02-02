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
