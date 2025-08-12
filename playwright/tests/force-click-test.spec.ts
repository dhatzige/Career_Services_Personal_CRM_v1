import { test } from '@playwright/test';

test('Force Click Test', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Logged in');

  // Debug - check what's visible
  const studentsLink = page.locator('a[href="/students"]').first();
  console.log('Students link count:', await page.locator('a[href="/students"]').count());
  console.log('Is visible?', await studentsLink.isVisible());
  console.log('Bounding box:', await studentsLink.boundingBox());
  
  // Force click on Students
  await studentsLink.click({ force: true });
  console.log('✅ Force clicked Students');
  
  await page.waitForURL('**/students');
  console.log('✅ On Students page');
  
  // Navigate to other pages with force clicks
  await page.locator('a[href="/calendar"]').first().click({ force: true });
  await page.waitForURL('**/calendar');
  console.log('✅ Calendar page');
  
  await page.locator('a[href="/career"]').first().click({ force: true });
  await page.waitForURL('**/career');
  console.log('✅ Career page');
  
  await page.locator('a[href="/settings"]').first().click({ force: true });
  await page.waitForURL('**/settings');
  console.log('✅ Settings page');
  
  await page.screenshot({ path: 'force-click-success.png', fullPage: true });
  console.log('\n🎉 Force click navigation successful!');
});