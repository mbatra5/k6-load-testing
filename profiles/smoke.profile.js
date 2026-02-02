/**
 * Smoke Test Profile
 * Quick validation with minimal load
 * 
 * Purpose: Verify system is functional before running full tests
 * Duration: 1-2 minutes
 * VUs: 5-10
 */

import { smokeThresholds } from '../config/thresholds.config.js';

export const smokeProfile = {
  executor: 'constant-vus',
  vus: 5,
  duration: '1m'
};

export const smokeOptions = {
  thresholds: smokeThresholds
};
