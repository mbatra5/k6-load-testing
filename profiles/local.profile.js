/**
 * Local Learning Profile
 * Minimal VUs for local machine testing - mirrors dry run configuration
 * 
 * Stages: 2→6→8→10→2 VUs over 15 minutes
 * Use case: Learning k6, testing on local machine without overwhelming resources
 */

import { localThresholds } from '../config/thresholds.config.js';

export const localProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '2m', target: 2 },    // Light start
    { duration: '3m', target: 6 },    // Ramp up
    { duration: '3m', target: 8 },    // Moderate load
    { duration: '4m', target: 10 },   // Peak load (local)
    { duration: '3m', target: 2 }     // Cool down
  ],
  gracefulRampDown: '30s'
};

export const localOptions = {
  thresholds: localThresholds
};
