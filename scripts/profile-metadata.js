/**
 * Profile metadata for generating narrative timelines
 * Maps test types to their descriptive metadata
 */

export const profileMetadata = {
  'demo-smoke': {
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
  },
  
  'demo-load': {
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
  },
  
  'demo-stress': {
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
  },
  
  'demo-spike': {
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
  },
  
  // Production test metadata (can be expanded later)
  'smoke': {
    purpose: 'Pre-deployment validation',
    pattern: 'Minimal load test with 5-10 users',
    description: 'Validates critical paths before deployment.',
    timeline: [
      { phase: 'Validation', duration: '1-2 minutes', load: '5-10 users', objective: 'Verify critical functionality' }
    ]
  },
  
  'load': {
    purpose: 'Peak capacity validation',
    pattern: 'Gradual ramp to 2400 users over 90 minutes',
    description: 'Tests system at expected peak production load.',
    timeline: [
      { phase: 'Test Execution', duration: '90 minutes', load: '200 → 2400 users', objective: 'Validate production capacity' }
    ]
  },
  
  'stress': {
    purpose: 'Find breaking point',
    pattern: 'Progressive load increase beyond capacity',
    description: 'Identifies system limits and failure modes.',
    timeline: [
      { phase: 'Stress Testing', duration: '60 minutes', load: '500 → 3000 users', objective: 'Determine maximum capacity' }
    ]
  },
  
  'spike': {
    purpose: 'Sudden traffic surge handling',
    pattern: 'Rapid spike to test auto-scaling',
    description: 'Tests response to unexpected traffic bursts.',
    timeline: [
      { phase: 'Spike Test', duration: '15 minutes', load: '100 → 2000 users', objective: 'Test auto-scaling and resilience' }
    ]
  },
  
  'soak': {
    purpose: 'Long-term stability and memory leak detection',
    pattern: 'Sustained load for extended duration',
    description: 'Runs for 4 hours to detect memory leaks and gradual degradation.',
    timeline: [
      { phase: 'Soak Test', duration: '4 hours', load: '500 users (constant)', objective: 'Monitor long-term stability' }
    ]
  },
  
  'local': {
    purpose: 'Local development and learning',
    pattern: 'Light load for testing on local machine',
    description: 'Low-intensity test for learning and local development.',
    timeline: [
      { phase: 'Local Test', duration: '15 minutes', load: '2-10 users', objective: 'Learn k6 and validate locally' }
    ]
  }
};
