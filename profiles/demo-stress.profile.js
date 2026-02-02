/**
 * DEMO: Stress Test Profile (5 minutes)
 * Pattern: Push beyond normal capacity to find breaking point
 * 
 * EASY TO ADJUST:
 * - Increase target numbers to push harder
 * - Decrease if system breaks too early
 */

import { httpThresholds } from '../config/thresholds.config.js';

export const demoStressProfile = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 100 },   // Warm up
    { duration: '2m', target: 150 },   // Normal load
    { duration: '2m', target: 200 }    // STRESS! Push to 200 max
  ],
  gracefulRampDown: '10s'
};

export const demoStressOptions = {
  thresholds: httpThresholds
};

// Test metadata for reporting
export const demoStressMetadata = {
  purpose: 'Find system breaking point by pushing beyond normal capacity',
  pattern: 'Progressive ramp from 0 to 200 users (above normal limits)',
  description: 'Stress tests push the system beyond its expected peak load to identify breaking points, bottlenecks, and failure modes. Helps determine maximum capacity before degradation.',
  timeline: [
    {
      phase: 'Warm-up',
      duration: '1 minute',
      load: '0 → 100 users',
      objective: 'Establish baseline at normal load'
    },
    {
      phase: 'Normal Peak',
      duration: '2 minutes',
      load: '100 → 150 users',
      objective: 'Operate at expected peak capacity'
    },
    {
      phase: 'Stress Phase',
      duration: '2 minutes',
      load: '150 → 200 users',
      objective: 'Push system beyond normal limits to find breaking point'
    }
  ]
};

/**
 * HOW TO ADJUST:
 * 
 * PUSH HARDER:
 * { duration: '2m', target: 250 }  // Push to 250 users
 * { duration: '1m', target: 300 }  // Push to 300!
 * 
 * PUSH LESS:
 * { duration: '2m', target: 180 }  // Gentle stress
 * 
 * Max VUs reduced to 200 to avoid rate limiting
 */
