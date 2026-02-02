/**
 * DEMO: Smoke Test Profile (1 minute)
 * Pattern: Quick sanity check with minimal load
 * 
 * EASY TO ADJUST:
 * - Change vus for more/less users
 * - Change duration for longer/shorter test
 */

import { smokeThresholds } from '../config/thresholds.config.js';

export const demoSmokeProfile = {
  executor: 'constant-vus',
  vus: 10,           // 10 concurrent users
  duration: '1m'     // For 1 minute
};

export const demoSmokeOptions = {
  thresholds: smokeThresholds
};

// Test metadata for reporting
export const demoSmokeMetadata = {
  purpose: 'Quick validation with constant load',
  pattern: 'Constant load - 10 concurrent users for 1 minute',
  description: 'Validates basic system health and ensures all critical endpoints respond correctly. This is a sanity check before running more intensive tests.',
  timeline: [
    {
      phase: 'Execution',
      duration: '1 minute',
      load: '10 users (constant)',
      objective: 'Verify system responds correctly under minimal load'
    }
  ]
};

/**
 * HOW TO ADJUST:
 * 
 * MORE USERS:
 * vus: 50              // 50 users instead of 10
 * 
 * LONGER TEST:
 * duration: '5m'       // 5 minutes instead of 1
 * 
 * SHORTER TEST:
 * duration: '30s'      // 30 seconds
 */
