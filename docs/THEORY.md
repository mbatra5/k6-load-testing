# K6 Load Testing - Theory & Concepts

## Table of Contents
1. [What is Load Testing?](#what-is-load-testing)
2. [Understanding Virtual Users (VUs)](#understanding-virtual-users-vus)
3. [Understanding Percentiles (p95, p99)](#understanding-percentiles-p95-p99)
4. [Test Types Explained](#test-types-explained)
5. [Thresholds - Pass/Fail Criteria](#thresholds---passfail-criteria)
6. [Browser vs HTTP Mode](#browser-vs-http-mode)
7. [Metrics Explained](#metrics-explained)
8. [Interpreting Results](#interpreting-results)

---

## What is Load Testing?

Load testing simulates real-world user traffic to measure how your system performs under expected and peak loads. It helps answer questions like:

- Can my system handle peak traffic?
- Where is the breaking point?
- How does performance degrade under stress?
- Are there memory leaks or stability issues?

---

## Understanding Virtual Users (VUs)

### What is a VU?

A **Virtual User (VU)** simulates one real user making requests to your system.

```
1 VU = 1 simulated user running your test script in a loop
```

### How VUs Work

Each VU:
1. Executes your test function (the `default` export)
2. Loops continuously for the duration specified
3. Runs independently and concurrently with other VUs

### Example

```javascript
// 10 VUs for 1 minute = each VU runs this function multiple times
export default function() {
  http.get('https://example.com');
  sleep(1); // Wait 1 second between requests
}
```

If each iteration takes ~1 second, with 10 VUs you'll get approximately:
- **10 requests per second** (10 VUs × 1 request/second)
- **600 total requests** over 1 minute

### VU Scaling

- **More VUs = More load**
- Browser mode: 10-50 VUs per machine (resource intensive)
- HTTP mode: 1000s of VUs per machine (lightweight)

---

## Understanding Percentiles (p95, p99)

### Why Not Just Use Average?

Averages hide outliers. Example:

```
10 requests: 100ms, 100ms, 100ms, ..., 100ms, 5000ms
Average: 545ms (misleading!)
p95: 100ms (more realistic for most users)
p99: 5000ms (shows the worst case)
```

### What is p95?

**p95 (95th percentile)**: 95% of requests completed within this time.

```
If p95 = 500ms:
- 95 out of 100 users got a response in ≤500ms
- Only 5 users experienced >500ms
```

### What is p99?

**p99 (99th percentile)**: 99% of requests completed within this time.

```
If p99 = 2000ms:
- 99 out of 100 users got a response in ≤2000ms
- Only 1 user experienced >2000ms
```

### Why These Matter

- **p95**: Good indicator of typical user experience
- **p99**: Shows worst-case scenarios
- **p50 (median)**: Middle value - half faster, half slower

### Real Example from Dry Run

```
browser_http_req_duration: 
  avg = 437.5ms   (average)
  p(95) = 1.89s   (95% of users)
  p(99) = 4.37s   (99% of users)
```

**Interpretation**: While average response is fast (437ms), 5% of users wait almost 2 seconds, and 1% wait over 4 seconds!

---

## Test Types Explained

### 1. Smoke Test

**Purpose**: Quick validation - "Is it working?"

```
VUs: 5-10 (minimal)
Duration: 1-2 minutes
When: Before deployment, sanity check
```

### 2. Load Test

**Purpose**: Normal peak traffic testing

```
VUs: Ramp to peak (e.g., 1200)
Duration: 60-90 minutes
When: Capacity planning, baseline establishment
Pattern: Gradual ramp-up
```

**Example**:
```javascript
stages: [
  { duration: '10m', target: 200 },   // Warm up
  { duration: '20m', target: 1200 },  // Peak
  { duration: '10m', target: 100 }    // Cool down
]
```

### 3. Stress Test

**Purpose**: Find breaking point

```
VUs: Exceed peak (e.g., 2x or 3x normal)
Duration: 60-90 minutes
When: Find system limits
Pattern: Push beyond capacity
```

### 4. Spike Test

**Purpose**: Sudden traffic surge

```
VUs: 100 → 2000 in 30 seconds
Duration: 20-30 minutes
When: Prepare for flash sales, viral events
Pattern: Sudden spike, then recovery
```

**Example**:
```javascript
stages: [
  { duration: '2m', target: 100 },   // Normal
  { duration: '30s', target: 2000 }, // SPIKE!
  { duration: '5m', target: 100 }    // Recovery
]
```

### 5. Soak Test

**Purpose**: Long-term stability, memory leaks

```
VUs: Moderate (500)
Duration: 4-8 hours
When: Check for memory leaks, degradation
Pattern: Sustained moderate load
```

### Visual Comparison

```
Smoke:    ___________
Load:     /‾‾‾‾‾‾‾‾\
Stress:   /‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
Spike:    _/\____
Soak:     /‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾\
```

---

## Thresholds - Pass/Fail Criteria

Thresholds define when a test passes or fails.

### Syntax

```javascript
thresholds: {
  'metric_name': ['condition1', 'condition2']
}
```

### Common Thresholds

```javascript
thresholds: {
  // 95% of requests must be under 500ms
  'http_req_duration': ['p(95)<500'],
  
  // Less than 1% errors
  'http_req_failed': ['rate<0.01'],
  
  // 99% of checks must pass
  'checks': ['rate>0.99'],
  
  // Average response time under 300ms
  'http_req_duration': ['avg<300']
}
```

### Per-Stage Thresholds

Different stages can have different thresholds:

```javascript
thresholds: {
  // More lenient during ramp-up
  'http_req_duration{stage:0}': ['p(95)<2000'],
  
  // Stricter at peak
  'http_req_duration{stage:2}': ['p(95)<500']
}
```

### When Test Fails

If ANY threshold fails, k6 exits with code 1 (failure). Perfect for CI/CD pipelines!

---

## Browser vs HTTP Mode

### Browser Mode (`k6/browser`)

**What it is**: Uses real Chromium browser

**Pros**:
- Measures real page load experience
- Includes rendering, JS execution
- Web Vitals (LCP, FCP, CLS, TTFB)
- Most realistic user simulation

**Cons**:
- Resource intensive
- Lower VU capacity (10-50 VUs per machine)
- Slower

**When to use**: Frontend load testing, measure actual user experience

**Example**:
```javascript
import { browser } from 'k6/browser';

export default async function() {
  const page = await browser.newPage();
  await page.goto('https://example.com');
  await page.close();
}
```

### HTTP Mode (`k6/http`)

**What it is**: Direct HTTP requests (no browser)

**Pros**:
- Very fast
- High VU capacity (1000s per machine)
- Lower resource usage

**Cons**:
- Doesn't measure rendering
- No JS execution
- No Web Vitals

**When to use**: API testing, high-volume load tests, backend testing

**Example**:
```javascript
import http from 'k6/http';

export default function() {
  http.get('https://example.com');
}
```

### Comparison

| Aspect | Browser Mode | HTTP Mode |
|--------|--------------|-----------|
| Realism | High (real browser) | Medium (HTTP only) |
| VU Capacity | 10-50 per machine | 1000s per machine |
| Speed | Slower | Fast |
| Use Case | Frontend testing | API/backend testing |

---

## Metrics Explained

### Built-in HTTP Metrics

```
http_req_duration: Total request time
http_req_waiting: Time to first byte (TTFB)
http_req_connecting: Connection time
http_req_sending: Sending request time
http_req_receiving: Receiving response time
http_req_failed: Percentage of failed requests
```

### Built-in Browser Metrics

```
browser_http_req_duration: Browser request time
browser_data_received: Data downloaded
browser_data_sent: Data uploaded
```

### Web Vitals (Browser Mode)

```
browser_web_vital_lcp: Largest Contentful Paint
  - When main content visible
  - Good: <2.5s
  
browser_web_vital_fcp: First Contentful Paint
  - When anything first appears
  - Good: <1.8s
  
browser_web_vital_cls: Cumulative Layout Shift
  - Visual stability
  - Good: <0.1
  
browser_web_vital_ttfb: Time to First Byte
  - Server response time
  - Good: <800ms
```

### Custom Metrics

You can create your own:

```javascript
import { Trend, Counter, Rate } from 'k6/metrics';

const pageLoadTime = new Trend('page_load_time');
const errors = new Counter('errors');
const successRate = new Rate('success_rate');

// Use them
pageLoadTime.add(1234);
errors.add(1);
successRate.add(true);
```

---

## Interpreting Results

### Sample k6 Output

```
checks.................: 100.00% ✓ 499  ✗ 0
http_req_duration......: avg=437ms  p(95)=1.89s  p(99)=4.37s
http_req_failed........: 0.00%   ✓ 0    ✗ 0
iterations.............: 499
vus....................: min=1 max=10
```

### What This Means

```
✅ All checks passed (100%)
⚠️  p95 is high (1.89s) - 5% of users had slow experience
⚠️  p99 is very high (4.37s) - need investigation
✅ No failed requests (0%)
ℹ️  499 iterations completed
ℹ️  Max 10 VUs used
```

### Red Flags to Watch For

1. **High p95/p99 vs Average**
   ```
   avg=200ms, p(95)=5000ms
   → Most users fine, but 5% having terrible experience
   ```

2. **Increasing Error Rate**
   ```
   http_req_failed: 0.05% (5%)
   → System struggling, errors increasing
   ```

3. **Failed Thresholds**
   ```
   ✗ http_req_duration: p(95)<500 (failed)
   → Performance target not met
   ```

4. **Increasing Response Times Over Time**
   ```
   0-10min: avg=200ms
   40-50min: avg=800ms
   → Possible memory leak or resource exhaustion
   ```

---

## Summary

**Key Takeaways**:

1. **VUs** simulate concurrent users
2. **p95/p99** are better than averages for understanding user experience
3. Different **test types** answer different questions
4. **Thresholds** define pass/fail criteria
5. **Browser mode** = realistic, **HTTP mode** = high capacity
6. Watch for **red flags** in results (high p95, increasing errors)

**Next Steps**: Run your first local test and analyze the HTML report!
