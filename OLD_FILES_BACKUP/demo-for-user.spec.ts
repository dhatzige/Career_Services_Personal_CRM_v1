import { test, expect } from '@playwright/test';

test('Demo CRM Features - Keep Browser Open', async ({ page }) => {
  console.log('🚀 Starting CRM demo - Browser will stay open for 30 seconds at the end');
  
  // 1. Login
  console.log('\n1️⃣ Navigating to login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForTimeout(1000);
  
  console.log('2️⃣ Filling login credentials...');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.waitForTimeout(1000);
  
  console.log('3️⃣ Clicking Sign In...');
  await page.click('button:has-text("Sign In")');
  
  console.log('4️⃣ Waiting for dashboard to load...');
  await page.waitForURL('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  console.log('✅ Successfully logged in! Dashboard is loaded.');
  
  // 2. Navigate to Students
  console.log('\n5️⃣ Clicking on Students in sidebar...');
  await page.click('nav a:has-text("Students")');
  await page.waitForURL('**/students');
  await page.waitForTimeout(2000);
  
  console.log('✅ Students page loaded!');
  
  // 3. Try to add a student
  console.log('\n6️⃣ Looking for Add Student button...');
  const addButton = page.locator('button:has-text("Add Student"), button:has-text("Add Your First Student")');
  if (await addButton.isVisible()) {
    console.log('7️⃣ Clicking Add Student button...');
    await addButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ Add Student modal/form should be visible');
  }
  
  // 4. Navigate to other pages
  console.log('\n8️⃣ Navigating to Calendar...');
  await page.click('nav a:has-text("Calendar")');
  await page.waitForURL('**/calendar');
  await page.waitForTimeout(2000);
  
  console.log('9️⃣ Navigating to Career Services...');
  await page.click('nav a:has-text("Career Services")');
  await page.waitForURL('**/career');
  await page.waitForTimeout(2000);
  
  console.log('🔟 Navigating to Settings...');
  await page.click('nav a:has-text("Settings")');
  await page.waitForURL('**/settings');
  await page.waitForTimeout(2000);
  
  console.log('\n✨ Demo complete! Keeping browser open for 30 seconds...');
  console.log('👀 You can interact with the CRM manually now!');
  
  // Keep browser open
  await page.waitForTimeout(30000);
  
  console.log('🏁 Demo finished!');
});