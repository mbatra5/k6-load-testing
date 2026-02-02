/**
 * DEMO: Spike Test Profile (5 minutes)
 * Pattern: Sudden traffic burst (flash sale, viral event)
 * 
 * EASY TO ADJUST:
 * - Change spike target for bigger/smaller burst
 * - Change spike duration for faster/slower burst
 */

import { httpThresholds } from '../config/thresholds.config.js';

export const demoSpikeProfile = {
  executor: 'ramping-vus',
  startVUs: 0,
  stages: [
    { duration: '1m', target: 50 },     // Normal traffic
    { duration: '30s', target: 200 },   // SPIKE! 4x in 30 seconds!
    { duration: '2m', target: 200 },    // Hold spike
    { duration: '30s', target: 50 },    // Quick recovery
    { duration: '1m', target: 0 }       // Cool down
  ],
  gracefulRampDown: '10s'
};

export const demoSpikeOptions = {
  thresholds: httpThresholds
};

// Test metadata for reporting
export const demoSpikeMetadata = {
  purpose: 'Test system resilience under sudden traffic bursts',
  pattern: 'Sudden spike from 50 to 200 users in 30 seconds',
  description: 'Spike tests simulate sudden traffic surges like flash sales, viral content, or breaking news. Tests auto-scaling, circuit breakers, and system recovery capabilities.',
  timeline: [
    {
      phase: 'Normal Traffic',
      duration: '1 minute',
      load: '0 → 50 users',
      objective: 'Establish baseline under normal conditions'
    },
    {
      phase: 'SPIKE!',
      duration: '30 seconds',
      load: '50 → 200 users (4x increase)',
      objective: 'Sudden traffic burst - tests auto-scaling and resilience'
    },
    {
      phase: 'Sustained Peak',
      duration: '2 minutes',
      load: '200 users (constant)',
      objective: 'Maintain spike load to test sustained high traffic'
    },
    {
      phase: 'Recovery',
      duration: '30 seconds',
      load: '200 → 50 users',
      objective: 'Quick drop to test system recovery'
    },
    {
      phase: 'Cool Down',
      duration: '1 minute',
      load: '50 → 0 users',
      objective: 'Return to normal and monitor cleanup'
    }
  ]
};

/**
 * HOW TO ADJUST:
 * 
 * BIGGER SPIKE:
 * { duration: '30s', target: 300 }  // Bigger spike!
 * 
 * FASTER SPIKE:
 * { duration: '10s', target: 200 }  // Spike in 10 seconds
 * 
 * LONGER SPIKE:
 * { duration: '5m', target: 200 }   // Hold for 5 minutes
 * 
 * Max VUs reduced to 200 to avoid rate limiting
 */
