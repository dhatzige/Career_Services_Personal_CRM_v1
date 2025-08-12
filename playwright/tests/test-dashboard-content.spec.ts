import { test, expect } from '@playwright/test';

test('Test dashboard loads after login', async ({ page }) => {
  // Navigate and login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  
  // Wait for navigation to root
  await page.waitForURL('http://localhost:5173/', { timeout: 10000 });
  console.log('✅ Redirected to:', page.url());
  
  // Wait for content to load
  await page.waitForTimeout(2000);
  
  // Check for dashboard content
  const pageContent = await page.textContent('body');
  console.log('Page has content:', pageContent && pageContent.length > 100 ? 'Yes' : 'No');
  
  // Look for specific dashboard elements
  const hasNavigation = await page.locator('nav').isVisible().catch(() => false);
  console.log('Has navigation:', hasNavigation);
  
  const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
  console.log('Has heading:', hasHeading);
  
  // Check for specific navigation links
  const navLinks = ['Dashboard', 'Students', 'Calendar', 'Career', 'Settings'];
  for (const link of navLinks) {
    const exists = await page.locator(`text="${link}"`).isVisible().catch(() => false);
    console.log(`Nav link "${link}":`, exists ? '✅' : '❌');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'dashboard-loaded.png', fullPage: true });
  
  // Check for any error messages
  const errors = await page.locator('.error, .text-red-500, [role="alert"]').allTextContents();
  if (errors.length > 0) {
    console.log('Error messages found:', errors);
  }
  
  // Try to navigate to Students page
  console.log('\nTesting navigation to Students page...');
  await page.click('a:has-text("Students")');
  await page.waitForURL('**/students', { timeout: 5000 });
  console.log('✅ Navigated to Students page');
  
  await page.screenshot({ path: 'students-page.png', fullPage: true });
});