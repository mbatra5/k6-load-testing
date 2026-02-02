/**
 * Stress Test Profile
 * Push system beyond normal peak to find breaking point
 * 
 * Purpose: Identify system limits and degradation patterns
 * Peak VUs: 2400 (2x normal peak)
 */

import { stressThresholds } from '../config/thresholds.config.js';

export const stressProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '5m', target: 500 },    // Quick ramp
    { duration: '10m', target: 1200 },  // Normal peak
    { duration: '15m', target: 2400 },  // 2x peak
    { duration: '20m', target: 3000 },  // Breaking point
    { duration: '10m', target: 100 }    // Recovery
  ],
  gracefulRampDown: '1m'
};

export const stressOptions = {
  thresholds: stressThresholds
};
