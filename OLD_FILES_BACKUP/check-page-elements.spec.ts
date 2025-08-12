import { test, expect } from '@playwright/test';

test('Check login page elements', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');
  
  // Take a full screenshot
  await page.screenshot({ path: 'login-page-full.png', fullPage: true });
  
  // Get all input elements
  const inputs = await page.locator('input').all();
  console.log(`Found ${inputs.length} input elements:`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');
    const name = await input.getAttribute('name');
    const isVisible = await input.isVisible();
    
    console.log(`Input ${i}:`, {
      type,
      placeholder,
      id,
      name,
      isVisible
    });
  }
  
  // Get all buttons
  const buttons = await page.locator('button').all();
  console.log(`\nFound ${buttons.length} buttons:`);
  
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const isVisible = await button.isVisible();
    
    console.log(`Button ${i}: "${text}" (visible: ${isVisible})`);
  }
  
  // Check for any error in console
  const pageContent = await page.content();
  console.log('\nPage contains CleanAuthPage?', pageContent.includes('CleanAuthPage'));
  console.log('Page contains AuthPage?', pageContent.includes('AuthPage'));
  
  // Check which auth context is loaded
  const scriptTags = await page.locator('script[type="module"]').all();
  console.log(`\nFound ${scriptTags.length} module scripts`);
});