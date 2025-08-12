import { chromium } from 'playwright';

async function checkConsoleErrors() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
    console.log(`${msg.type().toUpperCase()}: ${msg.text()}`);
  });
  
  // Collect page errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  // Navigate to login page
  console.log('Navigating to http://localhost:5173/login...\n');
  
  try {
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    console.log('\nPage loaded successfully');
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Take a screenshot
    await page.screenshot({ path: 'login-page-state.png' });
    console.log('Screenshot saved as login-page-state.png');
    
  } catch (error) {
    console.error('Navigation error:', error.message);
  }
  
  console.log('\n=== Summary of console messages ===');
  consoleMessages.forEach(msg => {
    console.log(`${msg.type}: ${msg.text}`);
  });
  
  // Keep browser open for inspection
  console.log('\nPress Ctrl+C to close the browser...');
}

checkConsoleErrors();