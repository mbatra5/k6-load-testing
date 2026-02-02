/**
 * Soak Test Profile
 * Extended duration test to find memory leaks and stability issues
 * 
 * Purpose: Verify system stability over extended period
 * Duration: 4-8 hours
 * VUs: Moderate (500) - sustained load
 */

import { loadThresholds } from '../config/thresholds.config.js';

export const soakProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '5m', target: 500 },    // Ramp up
    { duration: '4h', target: 500 },    // Sustained (4 hours)
    { duration: '5m', target: 0 }       // Ramp down
  ],
  gracefulRampDown: '1m'
};

export const soakOptions = {
  thresholds: loadThresholds
};
