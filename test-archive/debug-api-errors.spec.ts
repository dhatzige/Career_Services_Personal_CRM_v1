import { test, expect } from '@playwright/test';

test('Debug API 500 errors', async ({ page }) => {
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  // Listen for failed requests
  page.on('requestfailed', request => {
    console.log('Failed request:', request.url(), request.failure()?.errorText);
  });

  // Listen for responses
  page.on('response', async response => {
    if (response.status() >= 400) {
      console.log(`Error ${response.status()} for ${response.url()}`);
      try {
        const body = await response.text();
        console.log('Response body:', body);
      } catch (e) {
        console.log('Could not read response body');
      }
    }
  });

  // Go to the login page
  await page.goto('http://localhost:5173/login');
  
  // Try to log in with test credentials
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  
  // Wait a bit for any requests
  await page.waitForTimeout(2000);
  
  // Navigate to career page
  await page.goto('http://localhost:5173/career');
  await page.waitForTimeout(2000);
  
  // Navigate to calendar page
  await page.goto('http://localhost:5173/calendar');
  await page.waitForTimeout(2000);
});