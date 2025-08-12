import { test } from '@playwright/test';

test('Manual CRM Demo - Browser stays open', async ({ page }) => {
  console.log('🚀 Opening CRM for manual testing...');
  
  // Set viewport to ensure sidebar is visible
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  
  // Wait for dashboard
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in successfully!');
  console.log('\n📝 You can now manually test the CRM:');
  console.log('   - Click on Students, Calendar, Career Services, etc.');
  console.log('   - Try adding a student');
  console.log('   - Test the search functionality');
  console.log('   - Check the settings page');
  console.log('\n⏰ Browser will stay open for 2 minutes...');
  
  // Keep browser open for 2 minutes
  await page.waitForTimeout(120000);
  
  console.log('👋 Demo finished!');
});