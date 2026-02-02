/**
 * Cookie Generation Script
 * Mirrors the Playwright qa-automation pattern
 * 
 * Purpose: Navigate to IP whitelist URL to obtain CloudFront and authentication cookies
 * Usage: npm run cookies-setup
 */

import playwright from 'playwright';
import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function setupCookies() {
  try {
    console.log('🍪 Starting cookies setup...');

    // Launch a browser instance
    const browser = await playwright.chromium.launch({ headless: true });
    console.log('✅ Browser launched successfully.');

    // Create a new browser context
    const context = await browser.newContext();
    console.log('✅ Browser context created.');

    // Open a new page
    const page = await context.newPage();
    console.log('🌐 Navigating to IP whitelist URL...');
    await page.goto('https://canary-bp.navitas.bpglobal.com/nvp/ip-access');

    // Wait for page load and allow JS to set cookies
    await page.waitForLoadState('networkidle');
    
    // Get all cookies from context
    const cookies = await context.cookies();
    console.log(`✅ Retrieved ${cookies.length} cookies from context`);

    // Save cookies as-is (no transformation needed)
    const cookiesPath = resolve(__dirname, 'cookies.json');
    console.log(`💾 Saving cookies to ${cookiesPath}...`);
    writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log('✅ Cookies saved successfully.');

    // Close the browser
    await browser.close();
    console.log('✅ Browser closed.');
    console.log('');
    console.log('🎉 Cookie setup complete!');
    console.log('📄 Cookies saved to: utils/cookies.json');
    console.log('');
  } catch (error) {
    console.error('❌ Error during cookies setup:', error);
    throw error; // Rethrow the error to fail the process
  }
}

// Run if executed directly
setupCookies().catch((err) => {
  console.error('❌ Unhandled error in cookies setup:', err);
  process.exit(1);
});
