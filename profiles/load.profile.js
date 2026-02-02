/**
 * Load Test Profile
 * Normal peak load testing based on production traffic
 * 
 * Based on peak data:
 * - Peak concurrent users: 1,198
 * - Test with: 1,200 VUs
 * 
 * Stages:
 * - 10 mins: Ramp to 200 VUs
 * - 20 mins: Ramp to 800 VUs
 * - 20 mins: Ramp to 1,200 VUs (peak)
 * - 20 mins: Ramp to 2,400 VUs (2x peak for stress)
 * - 20 mins: Cool down to 100 VUs
 */

import { loadThresholds } from '../config/thresholds.config.js';

export const loadProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '10m', target: 200 },   // Stage 0: Light load
    { duration: '20m', target: 800 },   // Stage 1: Moderate load
    { duration: '20m', target: 1200 },  // Stage 2: Peak load
    { duration: '20m', target: 2400 },  // Stage 3: Stress (2x peak)
    { duration: '20m', target: 100 }    // Stage 4: Cool down
  ],
  gracefulRampDown: '1m'
};

export const loadOptions = {
  thresholds: loadThresholds
};
