#!/usr/bin/env node

/**
 * Generate Executive Summary Report from k6 JSON output
 * Reads HTML template and populates with test data
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { profileMetadata } from './profile-metadata.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Node.js compatible environment mapping (mirrors env.config.js)
const environments = {
  PREPROD: 'https://preprod.example.com',
  STAGING: 'https://staging.example.com',
  CANARY: 'https://canary.example.com',
  RELEASE: 'https://release.example.com',
  BETA: 'https://beta.example.com',
  PROD: 'https://www.example.com'
};

const jsonFile = process.argv[2];
const outputFile = process.argv[3];
const technicalReportPath = process.argv[4] || '';

if (!jsonFile || !outputFile) {
  console.error('Usage: node generate-executive-summary.js <input.json> <output.html> [technical-report.html]');
  process.exit(1);
}

try {
  // Read JSON data
  const data = readFileSync(jsonFile, 'utf8');
  const lines = data.trim().split('\n');
  
  const metrics = {};
  const points = [];
  let testMetadata = {};
  
  // Parse k6 JSON output
  let targetUrl = '';
  let firstRelativePath = '';
  lines.forEach(line => {
    try {
      const item = JSON.parse(line);
      
      if (item.type === 'Metric' && item.data) {
        if (!metrics[item.metric]) {
          metrics[item.metric] = { type: item.data.type, values: [], tags: {} };
        }
      }
      
      if (item.type === 'Point' && item.data) {
        points.push({
          time: new Date(item.data.time),
          metric: item.metric,
          value: item.data.value,
          tags: item.data.tags || {}
        });
        
        // Extract target URL from first http request
        if (!targetUrl && item.metric === 'http_reqs' && item.data.tags && item.data.tags.url) {
          try {
            // Try to parse as full URL first
            const url = new URL(item.data.tags.url);
            targetUrl = url.origin;
          } catch (e) {
            // If it fails, it's a relative URL - store it for later
            if (!firstRelativePath) {
              firstRelativePath = item.data.tags.url;
            }
          }
        }
        
        // Track stage-wise metrics
        if (item.data.tags && item.data.tags.stage !== undefined) {
          const stage = item.data.tags.stage;
          if (!metrics[item.metric].tags[stage]) {
            metrics[item.metric].tags[stage] = [];
          }
          metrics[item.metric].tags[stage].push(item.data.value);
        }
      }
    } catch (e) {
      // Skip invalid lines
    }
  });
  
  // Determine final target URL
  if (!targetUrl && process.env.ENV) {
    const env = process.env.ENV;
    targetUrl = env.startsWith('http') ? env : (environments[env] || 'Test Target');
  }
  if (!targetUrl) {
    targetUrl = 'Test Target';
  }
  
  // Calculate statistics
  function calcStats(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(values.length * 0.5)],
      p90: sorted[Math.floor(values.length * 0.9)],
      p95: sorted[Math.floor(values.length * 0.95)],
      p99: sorted[Math.floor(values.length * 0.99)]
    };
  }
  
  // Extract key metrics
  const httpReqDuration = points.filter(p => p.metric === 'http_req_duration').map(p => p.value);
  const httpReqFailed = points.filter(p => p.metric === 'http_req_failed').map(p => p.value);
  const iterations = points.filter(p => p.metric === 'iterations').map(p => p.value);
  const vus = points.filter(p => p.metric === 'vus').map(p => p.value);
  
  const durationStats = calcStats(httpReqDuration);
  const totalRequests = httpReqDuration.length;
  const failedRequests = httpReqFailed.filter(v => v === 1).length;
  const successRate = totalRequests > 0 ? ((totalRequests - failedRequests) / totalRequests * 100).toFixed(2) : 0;
  
  // Analyze stages
  const stageData = [];
  const uniqueStages = [...new Set(points.filter(p => p.tags.stage !== undefined).map(p => p.tags.stage))].sort();
  
  uniqueStages.forEach(stage => {
    const stagePoints = points.filter(p => p.tags.stage === stage && p.metric === 'http_req_duration');
    const stageFailedPoints = points.filter(p => p.tags.stage === stage && p.metric === 'http_req_failed');
    const stageVUs = points.filter(p => p.tags.stage === stage && p.metric === 'vus');
    
    if (stagePoints.length > 0) {
      const stats = calcStats(stagePoints.map(p => p.value));
      const failed = stageFailedPoints.filter(p => p.value === 1).length;
      const total = stagePoints.length;
      const successRate = total > 0 ? ((total - failed) / total * 100).toFixed(1) : 100;
      const avgVUs = stageVUs.length > 0 ? Math.round(stageVUs.reduce((a, b) => a + b.value, 0) / stageVUs.length) : 0;
      const maxVUs = stageVUs.length > 0 ? Math.max(...stageVUs.map(p => p.value)) : 0;
      
      // Determine stage status
      let status = 'success';
      let observations = [];
      
      if (failed > 0) {
        const failRate = (failed / total * 100).toFixed(1);
        observations.push(`${failed} failed requests (${failRate}%)`);
        if (failRate > 10) status = 'error';
        else if (failRate > 5) status = 'warning';
      }
      
      if (stats.avg > 2000) {
        observations.push(`High average response time: ${Math.round(stats.avg)}ms`);
        if (status === 'success') status = 'warning';
      }
      
      if (stats.p95 > 3000) {
        observations.push(`p95 latency exceeded 3s`);
        if (status === 'success') status = 'warning';
      }
      
      if (observations.length === 0 && successRate >= 95) {
        observations.push('All metrics within acceptable range');
      }
      
      stageData.push({
        stage,
        avgVUs,
        maxVUs,
        requests: total,
        failed,
        successRate,
        avgResponse: Math.round(stats.avg),
        p95: Math.round(stats.p95),
        status,
        observations
      });
    }
  });
  
  // Generate comprehensive findings in non-technical language
  const findings = [];
  const maxVUs = Math.max(...vus);
  const avgResponseTime = durationStats ? Math.round(durationStats.avg) : 0;
  const p95ResponseTime = durationStats ? Math.round(durationStats.p95) : 0;
  const p99ResponseTime = durationStats ? Math.round(durationStats.p99) : 0;
  const totalIterations = iterations.length;
  const testDurationSeconds = points.length > 0 ? (points[points.length - 1].time - points[0].time) / 1000 : 0;
  const requestsPerSecond = testDurationSeconds > 0 ? (totalRequests / testDurationSeconds).toFixed(1) : 0;
  
  // 1. Overall Success Rate
  if (successRate >= 99) {
    findings.push(`Excellent success rate of ${successRate}% - nearly all requests succeeded, demonstrating robust system stability`);
  } else if (successRate >= 95) {
    findings.push(`Good success rate of ${successRate}% - system performance is stable with minimal failures`);
  } else if (successRate >= 90) {
    findings.push(`Success rate of ${successRate}% is below ideal (95%) - some users experienced failures, investigate error patterns`);
  } else {
    findings.push(`Critical: Success rate of ${successRate}% is unacceptable - significant portion of users unable to access the system`);
  }
  
  // 2. Average Response Time (Typical User Experience)
  if (avgResponseTime < 100) {
    findings.push(`Outstanding average response time of ${avgResponseTime}ms - users experience near-instant page loads`);
  } else if (avgResponseTime < 500) {
    findings.push(`Excellent average response time of ${avgResponseTime}ms - fast and responsive for typical users`);
  } else if (avgResponseTime < 1000) {
    findings.push(`Good average response time of ${avgResponseTime}ms - acceptable performance for most users`);
  } else if (avgResponseTime < 2000) {
    findings.push(`Moderate average response time of ${avgResponseTime}ms - users may notice slight delays`);
  } else {
    findings.push(`Slow average response time of ${avgResponseTime}ms - optimization needed to improve user experience`);
  }
  
  // 3. p95 Analysis (95% of users)
  if (p95ResponseTime > 0) {
    if (p95ResponseTime < 200) {
      findings.push(`95% of users experienced response times under ${p95ResponseTime}ms - consistently fast for almost everyone`);
    } else if (p95ResponseTime < 1000) {
      findings.push(`95% of users experienced response times under ${p95ResponseTime}ms - only 1 in 20 users waited longer than this`);
    } else if (p95ResponseTime < 2000) {
      findings.push(`95% of users waited less than ${p95ResponseTime}ms for responses - acceptable but room for improvement`);
    } else {
      findings.push(`95% of users waited less than ${p95ResponseTime}ms - the slowest 5% experienced significant delays, investigate bottlenecks`);
    }
  }
  
  // 4. Consistency Analysis (p95 vs Average)
  if (durationStats && p95ResponseTime > 0) {
    const consistencyRatio = p95ResponseTime / avgResponseTime;
    if (consistencyRatio < 2) {
      findings.push(`Highly consistent performance - the slowest 5% of requests were only ${consistencyRatio.toFixed(1)}x slower than average, indicating predictable response times`);
    } else if (consistencyRatio < 3) {
      findings.push(`Moderate consistency - slowest requests were ${consistencyRatio.toFixed(1)}x slower than average, some variability present`);
    } else {
      findings.push(`Inconsistent performance detected - slowest 5% were ${consistencyRatio.toFixed(1)}x slower than average, indicating some requests face significant issues`);
    }
  }
  
  // 5. Throughput & Capacity
  findings.push(`System processed ${totalRequests.toLocaleString()} requests during the test at ${requestsPerSecond} requests per second`);
  
  if (requestsPerSecond > 1) {
    const requestsPerHour = (requestsPerSecond * 3600).toFixed(0);
    findings.push(`At this throughput rate, system can handle approximately ${parseInt(requestsPerHour).toLocaleString()} requests per hour under similar load conditions`);
  }
  
  // 6. Concurrent User Capacity
  findings.push(`Successfully handled ${maxVUs} concurrent users - this represents the tested capacity level`);
  
  // 7. Error Pattern Analysis
  if (failedRequests > 0) {
    const failRate = (failedRequests / totalRequests * 100).toFixed(1);
    if (failRate < 1) {
      findings.push(`Minimal failure rate (${failRate}%) with ${failedRequests} failed requests out of ${totalRequests.toLocaleString()} - likely transient network issues`);
    } else if (failRate < 5) {
      findings.push(`Low failure rate (${failRate}%) with ${failedRequests} failed requests - monitor these errors to prevent escalation`);
    } else if (failRate < 10) {
      findings.push(`Moderate failure rate (${failRate}%) with ${failedRequests} failed requests - investigate root cause of these failures`);
    } else {
      findings.push(`High failure rate (${failRate}%) with ${failedRequests} failed requests - critical issue requiring immediate attention`);
    }
  } else {
    findings.push(`Zero failed requests - perfect reliability throughout the entire test duration`);
  }
  
  // 8. Performance Stability Over Time
  if (stageData.length > 1) {
    const firstStage = stageData[0];
    const lastStage = stageData[stageData.length - 1];
    const degradation = ((lastStage.avgResponse - firstStage.avgResponse) / firstStage.avgResponse * 100).toFixed(1);
    
    if (degradation < 10) {
      findings.push(`Performance remained stable throughout test - response times only varied by ${Math.abs(degradation)}% from start to finish`);
    } else if (degradation < 30) {
      findings.push(`Moderate performance degradation of ${degradation}% as load increased - system showing signs of stress but remaining functional`);
    } else if (degradation > 30) {
      findings.push(`Significant performance degradation of ${degradation}% as load increased - system struggling under peak load`);
    }
  }
  
  // 9. Capacity Headroom Assessment
  if (successRate >= 99 && avgResponseTime < 500) {
    findings.push(`Strong performance indicators suggest system has headroom to handle additional load beyond ${maxVUs} users`);
  } else if (successRate >= 95 && avgResponseTime < 1000) {
    findings.push(`System is operating near optimal capacity at ${maxVUs} users - can likely handle moderate increases with monitoring`);
  } else if (successRate < 95 || avgResponseTime > 2000) {
    findings.push(`System is at or beyond comfortable capacity at ${maxVUs} users - additional load may cause service degradation`);
  }
  
  // 10. Peak Performance Moment
  if (maxVUs >= 100) {
    findings.push(`Peak load of ${maxVUs} concurrent users represents ${maxVUs < 50 ? 'light' : maxVUs < 200 ? 'moderate' : maxVUs < 1000 ? 'heavy' : 'extreme'} stress testing conditions`);
  }
  
  // Generate recommendations
  const recommendations = [];
  if (failedRequests > 0) {
    const failRate = (failedRequests / totalRequests * 100).toFixed(1);
    if (failRate > 10) {
      recommendations.push('High error rate detected - investigate server logs and error responses');
    } else {
      recommendations.push('Monitor error patterns and implement retry mechanisms for transient failures');
    }
  }
  
  if (durationStats && durationStats.p95 > 2000) {
    recommendations.push('p95 latency exceeds 2 seconds - optimize slow endpoints and database queries');
  }
  
  if (successRate < 95) {
    recommendations.push('Implement rate limiting and circuit breakers to handle high load gracefully');
  } else {
    recommendations.push('System is performing well - continue monitoring under production load');
  }
  
  // Determine overall status
  let overallStatus = 'passed';
  let statusText = '✅ PASSED';
  let statusClass = 'passed';
  
  if (successRate < 90 || (durationStats && durationStats.p95 > 5000)) {
    overallStatus = 'failed';
    statusText = '❌ FAILED';
    statusClass = 'failed';
  } else if (successRate < 95 || (durationStats && durationStats.p95 > 3000)) {
    overallStatus = 'warning';
    statusText = '⚠️ WARNING';
    statusClass = 'warning';
  }
  
  // Generate conclusion
  let conclusion = '';
  if (overallStatus === 'passed') {
    conclusion = `The system successfully handled the test load with ${successRate}% success rate and an average response time of ${Math.round(durationStats.avg)}ms. All performance metrics are within acceptable thresholds. The system is ready for production traffic at this scale.`;
  } else if (overallStatus === 'warning') {
    conclusion = `The system handled the test with ${successRate}% success rate but showed signs of stress under peak load. Average response time was ${Math.round(durationStats.avg)}ms with p95 at ${Math.round(durationStats.p95)}ms. Performance optimization is recommended before scaling to higher loads.`;
  } else {
    conclusion = `The system struggled under test load with only ${successRate}% success rate. Performance degradation was significant with p95 latency at ${Math.round(durationStats.p95)}ms. Critical issues must be addressed before production deployment.`;
  }
  
  // Read template
  const templatePath = resolve(__dirname, '../templates/executive-summary.html');
  let template = readFileSync(templatePath, 'utf8');
  
  // Extract test type from JSON filename (used for metadata and naming)
  const testType = jsonFile.split('/').pop().replace('.json', '');
  const metadata = profileMetadata[testType];
  
  let stagesHTML = '';
  if (metadata && metadata.timeline) {
    stagesHTML = `
      <div style="background: #e8f4f8; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
        <h3 style="margin-bottom: 10px; color: #2c3e50;">Test Purpose</h3>
        <p style="font-size: 15px; color: #34495e;">${metadata.description}</p>
      </div>
      
      ${metadata.timeline.map((item, idx) => `
        <div class="stage">
          <div class="stage-header">📍 Phase ${idx + 1}: ${item.phase}</div>
          <div class="stage-time">Duration: ${item.duration}</div>
          <ul class="stage-metrics">
            <li><strong>Load Pattern:</strong> ${item.load}</li>
            <li><strong>Objective:</strong> ${item.objective}</li>
          </ul>
        </div>
      `).join('')}
    `;
  } else {
    // Fallback: use runtime stage data if available
    stagesHTML = stageData.map((stage, idx) => `
      <div class="stage ${stage.status}">
        <div class="stage-header">Stage ${parseInt(stage.stage) + 1}: ${stage.avgVUs} → ${stage.maxVUs} Virtual Users</div>
        <div class="stage-time">Time: ${idx === 0 ? '0' : ''}min onwards</div>
        <ul class="stage-metrics">
          <li>Requests: <span class="metric-good">${stage.requests}</span></li>
          <li>Success Rate: <span class="${stage.successRate >= 95 ? 'metric-good' : stage.successRate >= 90 ? 'metric-warning' : 'metric-bad'}">${stage.successRate}%</span></li>
          <li>Avg Response Time: <span class="${stage.avgResponse < 1000 ? 'metric-good' : stage.avgResponse < 2000 ? 'metric-warning' : 'metric-bad'}">${stage.avgResponse}ms</span></li>
          <li>p95 Latency: <span class="${stage.p95 < 2000 ? 'metric-good' : stage.p95 < 3000 ? 'metric-warning' : 'metric-bad'}">${stage.p95}ms</span></li>
          ${stage.failed > 0 ? `<li>Failed Requests: <span class="metric-bad">${stage.failed}</span></li>` : ''}
        </ul>
        <div class="stage-metrics" style="margin-top:10px; padding-left:0; font-style:italic; color:#7f8c8d;">
          ${stage.observations.map(obs => `• ${obs}`).join('<br>')}
        </div>
      </div>
    `).join('');
  }
  
  // Get test start time
  const firstPoint = points[0];
  const testDate = firstPoint ? firstPoint.time.toLocaleString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleString();
  
  const testDuration = points.length > 0 ? 
    Math.round((points[points.length - 1].time - points[0].time) / 1000 / 60) + ' minutes' : 
    'Unknown';
  
  // Determine test name from test type
  const testNameMap = {
    'demo-smoke': 'Demo Smoke Test',
    'demo-load': 'Demo Load Test',
    'demo-stress': 'Demo Stress Test',
    'demo-spike': 'Demo Spike Test',
    'smoke': 'Smoke Test',
    'load': 'Load Test',
    'stress': 'Stress Test',
    'spike': 'Spike Test',
    'soak': 'Soak Test',
    'local': 'Local Test',
    'api-smoke': 'API Smoke Test',
    'api-load': 'API Load Test',
    'api-stress': 'API Stress Test'
  };
  
  const testName = testNameMap[testType] || 'Load Test';
  
  // Replace placeholders (using replaceAll to replace ALL occurrences)
  template = template.replaceAll('{{TEST_NAME}}', testName);
  template = template.replaceAll('{{TEST_DATE}}', testDate);
  template = template.replaceAll('{{TARGET_URL}}', targetUrl || 'Test Target');
  template = template.replaceAll('{{DURATION}}', testDuration);
  template = template.replaceAll('{{STATUS_CLASS}}', statusClass);
  template = template.replaceAll('{{STATUS_TEXT}}', statusText);
  template = template.replaceAll('{{TOTAL_REQUESTS}}', totalRequests.toLocaleString());
  template = template.replaceAll('{{SUCCESS_RATE}}', successRate + '%');
  template = template.replaceAll('{{AVG_RESPONSE}}', durationStats ? Math.round(durationStats.avg) + 'ms' : 'N/A');
  template = template.replaceAll('{{P95_RESPONSE}}', durationStats ? Math.round(durationStats.p95) + 'ms' : 'N/A');
  template = template.replaceAll('{{STAGES}}', stagesHTML);
  template = template.replaceAll('{{FINDINGS}}', findings.map(f => `<li>${f}</li>`).join('\n'));
  template = template.replaceAll('{{RECOMMENDATIONS}}', recommendations.map(r => `<li>${r}</li>`).join('\n'));
  template = template.replaceAll('{{CONCLUSION}}', conclusion);
  template = template.replaceAll('{{TECHNICAL_REPORT_PATH}}', technicalReportPath || '#');
  template = template.replaceAll('{{GENERATED_TIME}}', new Date().toLocaleString());
  
  // Write output
  writeFileSync(outputFile, template);
  console.log(`✅ Executive summary generated: ${outputFile}`);
  console.log(`📊 Overall Status: ${statusText}`);
  console.log(`📈 Success Rate: ${successRate}%`);
  
} catch (error) {
  console.error('❌ Error generating executive summary:', error.message);
  process.exit(1);
}
