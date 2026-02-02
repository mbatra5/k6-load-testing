/**
 * Spike Test Profile
 * Sudden traffic burst to test system recovery
 * 
 * Purpose: Simulate flash traffic (product launch, news event)
 * Pattern: Normal → Sudden spike → Recovery
 */

import { stressThresholds } from '../config/thresholds.config.js';

export const spikeProfile = {
  executor: 'ramping-vus',
  startVUs: 1,
  stages: [
    { duration: '2m', target: 100 },    // Normal load
    { duration: '30s', target: 2000 },  // Sudden spike!
    { duration: '5m', target: 2000 },   // Sustained spike
    { duration: '1m', target: 100 },    // Quick recovery
    { duration: '5m', target: 100 }     // Observe stability
  ],
  gracefulRampDown: '30s'
};

export const spikeOptions = {
  thresholds: stressThresholds  // Use stress thresholds (more lenient)
};
