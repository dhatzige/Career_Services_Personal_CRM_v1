import { test } from '@playwright/test';

test('Check dashboard errors after login', async ({ page }) => {
  // Capture all console messages
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(text);
    console.log(text);
  });

  // Capture network errors
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    consoleLogs.push(`[PAGE ERROR] ${error.message}`);
  });

  // Navigate to login
  await page.goto('http://localhost:5173/login');
  
  // Login
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('Navigated to:', page.url());
  
  // Wait a bit for any errors to appear
  await page.waitForTimeout(2000);
  
  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Page content:', bodyText?.trim() || '(empty)');
  
  // Take screenshot
  await page.screenshot({ path: 'dashboard-error-state.png' });
  
  // Print all console logs
  console.log('\n=== ALL CONSOLE LOGS ===');
  consoleLogs.forEach(log => console.log(log));
  
  // Check for specific error patterns
  const errors = consoleLogs.filter(log => 
    log.includes('error') || 
    log.includes('Error') || 
    log.includes('failed') ||
    log.includes('Failed')
  );
  
  if (errors.length > 0) {
    console.log('\n=== ERRORS FOUND ===');
    errors.forEach(err => console.log(err));
  }
});