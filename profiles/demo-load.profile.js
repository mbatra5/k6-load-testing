/**
 * DEMO: Load Test Profile (5 minutes)
 * Pattern: Gradual ramp-up to peak, then ramp down
 * 
 * EASY TO ADJUST:
 * - Change target numbers in stages array
 * - Change duration strings (e.g., '1m' = 1 minute, '30s' = 30 seconds)
 * - Total duration = sum of all stage durations
 */

import { httpThresholds } from '../config/thresholds.config.js';

export const demoLoadProfile = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 100 },   // Ramp up to 100 users (1 min)
    { duration: '2m', target: 200 },   // Ramp up to 200 users (2 min)
    { duration: '1m', target: 100 },   // Ramp down to 100 (1 min)
    { duration: '1m', target: 0 }      // Ramp down to 0 (1 min)
  ],
  gracefulRampDown: '10s'
};

export const demoLoadOptions = {
  thresholds: httpThresholds
};

// Test metadata for reporting
export const demoLoadMetadata = {
  purpose: 'Normal capacity testing with gradual load increase',
  pattern: 'Gradual ramp from 0 to 200 users over 5 minutes',
  description: 'Tests system behavior under normal peak load conditions. Gradually increases load to identify capacity limits and monitors performance degradation as load increases.',
  timeline: [
    {
      phase: 'Warm-up',
      duration: '1 minute',
      load: '0 → 100 users',
      objective: 'Gradual ramp-up to establish baseline performance'
    },
    {
      phase: 'Peak Load',
      duration: '2 minutes',
      load: '100 → 200 users',
      objective: 'Test system at normal peak capacity'
    },
    {
      phase: 'Ramp Down (Recovery)',
      duration: '1 minute',
      load: '200 → 100 users',
      objective: 'Monitor how system handles decreasing load'
    },
    {
      phase: 'Cool Down',
      duration: '1 minute',
      load: '100 → 0 users',
      objective: 'Graceful shutdown and final cleanup'
    }
  ]
};

/**
 * HOW TO ADJUST:
 * 
 * 1. CHANGE USER COUNTS:
 *    { duration: '1m', target: 300 }  // 300 users instead of 200
 * 
 * 2. CHANGE DURATION:
 *    { duration: '30s', target: 100 }  // 30 seconds instead of 1 minute
 *    { duration: '5m', target: 200 }   // 5 minutes
 * 
 * 3. ADD MORE STAGES:
 *    { duration: '1m', target: 150 },
 *    { duration: '1m', target: 200 }
 * 
 * Total test time = 1m + 2m + 1m + 1m = 5 minutes
 * Max VUs reduced to 200 to avoid rate limiting
 */
