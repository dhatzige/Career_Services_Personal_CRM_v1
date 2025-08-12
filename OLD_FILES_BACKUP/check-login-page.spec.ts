import { test, expect } from '@playwright/test';

test.describe('Check Login Page', () => {
  test('Check what is on the login page', async ({ page }) => {
    // Navigate to the login page
    await page.goto('http://localhost:5173/login');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Take a screenshot
    await page.screenshot({ path: 'login-page.png', fullPage: true });
    
    // Log all visible text
    const visibleText = await page.textContent('body');
    console.log('Visible text on page:', visibleText);
    
    // Check for any input fields
    const inputs = await page.locator('input').all();
    console.log(`Found ${inputs.length} input fields`);
    
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const name = await inputs[i].getAttribute('name');
      console.log(`Input ${i}: type=${type}, placeholder=${placeholder}, name=${name}`);
    }
    
    // Check for buttons
    const buttons = await page.locator('button').all();
    console.log(`Found ${buttons.length} buttons`);
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`Button ${i}: ${text}`);
    }
  });
});