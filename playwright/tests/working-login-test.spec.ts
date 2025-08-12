import { test, expect } from '@playwright/test';

test('Login with Supabase Auth', async ({ page }) => {
  console.log('1. Navigating to login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  console.log('2. Filling login form...');
  // Use the correct selectors
  await page.locator('input[type="email"]').fill('dhatzige@act.edu');
  await page.locator('input[type="password"]').fill('!)DQeop4');
  
  console.log('3. Clicking Sign In...');
  await page.locator('button:has-text("Sign In")').click();
  
  console.log('4. Waiting for navigation...');
  // Wait for either success or error
  const result = await Promise.race([
    page.waitForURL('**/dashboard', { timeout: 10000 }).then(() => 'success'),
    page.waitForURL('**/students', { timeout: 10000 }).then(() => 'success'),
    page.waitForSelector('.error, .text-red-500', { timeout: 10000 }).then(() => 'error'),
    page.waitForTimeout(10000).then(() => 'timeout')
  ]);
  
  console.log('5. Result:', result);
  
  if (result === 'success') {
    console.log('✅ Login successful! Current URL:', page.url());
    await page.screenshot({ path: 'login-success.png' });
    
    // Test navigation
    console.log('6. Testing navigation...');
    await page.locator('a[href="/students"]').click();
    await page.waitForURL('**/students');
    console.log('✅ Navigated to Students page');
    
    // Test logout
    console.log('7. Testing logout...');
    await page.locator('button:has-text("Logout"), button:has-text("Sign Out")').click();
    await page.waitForURL('**/login');
    console.log('✅ Logout successful');
    
  } else if (result === 'error') {
    const errorText = await page.locator('.error, .text-red-500').first().textContent();
    console.log('❌ Login failed with error:', errorText);
    await page.screenshot({ path: 'login-error.png' });
  } else {
    console.log('❌ Login timed out');
    await page.screenshot({ path: 'login-timeout.png' });
    const currentUrl = page.url();
    console.log('Still on URL:', currentUrl);
  }
});