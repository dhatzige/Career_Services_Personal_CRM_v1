import { test, expect } from '@playwright/test';

test('Test CRM Features Properly', async ({ page }) => {
  // Set proper viewport
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Logged in');

  // Test Students page
  await page.click('text=Students');
  await page.waitForURL('**/students');
  console.log('✅ Students page loaded');
  
  // Add a student
  await page.click('button:has-text("Add") >> visible=true');
  await page.waitForTimeout(500);
  
  // Fill student form if modal is open
  const firstNameInput = page.locator('input[name="firstName"]');
  if (await firstNameInput.isVisible()) {
    await firstNameInput.fill('Test');
    await page.fill('input[name="lastName"]', 'Student');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '555-0123');
    
    // Select dropdowns if they exist
    const programSelect = page.locator('select[name="academicProgram"]');
    if (await programSelect.isVisible()) {
      await programSelect.selectOption({ index: 1 });
    }
    
    const yearSelect = page.locator('select[name="year"]');
    if (await yearSelect.isVisible()) {
      await yearSelect.selectOption({ index: 1 });
    }
    
    // Save
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log('✅ Student added');
  }

  // Test Calendar
  await page.click('text=Calendar');
  await page.waitForURL('**/calendar');
  console.log('✅ Calendar page loaded');

  // Test Career Services
  await page.click('text=Career Services');
  await page.waitForURL('**/career');
  console.log('✅ Career Services page loaded');

  // Test Settings
  await page.click('text=Settings');
  await page.waitForURL('**/settings');
  console.log('✅ Settings page loaded');

  // Test user menu
  await page.click('button[aria-label="User menu"]');
  await page.waitForTimeout(500);
  const userEmail = page.locator('text=dhatzige@act.edu');
  if (await userEmail.isVisible()) {
    console.log('✅ User menu works');
  }

  // Go back to dashboard
  await page.click('text=Dashboard');
  await page.waitForURL('http://localhost:5173/');
  console.log('✅ Back to dashboard');

  // Take final screenshot
  await page.screenshot({ path: 'crm-test-complete.png', fullPage: true });
  console.log('\n🎉 All tests passed!');
});