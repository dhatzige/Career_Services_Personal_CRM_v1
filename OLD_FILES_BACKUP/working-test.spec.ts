import { test } from '@playwright/test';

test('Working CRM Test', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Logged in');
  
  // Wait for page to stabilize
  await page.waitForTimeout(1000);
  
  // Click on the FIRST visible Students link
  await page.locator('a:has-text("Students")').first().click();
  await page.waitForURL('**/students');
  console.log('✅ Students page loaded');
  
  // Click Add Student button
  await page.click('button:has-text("Add Your First Student"), button:has-text("Add Student")');
  await page.waitForTimeout(1000);
  console.log('✅ Add Student clicked');
  
  // Check if modal opened and close it
  const closeButton = page.locator('button[aria-label="Close"], button:has-text("Cancel"), button:has-text("Close")').first();
  if (await closeButton.isVisible()) {
    await closeButton.click();
    console.log('✅ Closed student form');
  }
  
  // Navigate to Calendar
  await page.locator('a:has-text("Calendar")').first().click();
  await page.waitForURL('**/calendar');
  console.log('✅ Calendar loaded');
  
  // Navigate to Career Services
  await page.locator('a:has-text("Career Services")').first().click();
  await page.waitForURL('**/career');
  console.log('✅ Career Services loaded');
  
  // Navigate to Settings
  await page.locator('a:has-text("Settings")').first().click();
  await page.waitForURL('**/settings');
  console.log('✅ Settings loaded');
  
  // Back to Dashboard
  await page.locator('a:has-text("Dashboard")').first().click();
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Back to Dashboard');
  
  // Test logout
  await page.click('button[aria-label="User menu"]');
  await page.waitForTimeout(500);
  await page.click('text=Sign out');
  await page.waitForURL('**/login');
  console.log('✅ Logged out successfully');
  
  console.log('\n🎉 All tests passed!');
});