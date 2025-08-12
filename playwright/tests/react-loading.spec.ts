import { test, expect } from '@playwright/test';

test.describe('React Module Loading', () => {
  test('should load React modules correctly', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser console ${msg.type()}: ${msg.text()}`);
    });
    
    // Capture any page errors
    const errors: string[] = [];
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('Page error:', error.message);
    });

    // Navigate to the app
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    // Check if React is loaded by evaluating in browser context
    const reactLoaded = await page.evaluate(() => {
      return typeof window.React !== 'undefined';
    });

    // Check if the root element exists
    const rootExists = await page.locator('#root').count() > 0;

    // Check for any module loading errors
    const moduleErrors = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script'));
      return scripts.filter(s => s.hasAttribute('data-error')).map(s => s.getAttribute('data-error'));
    });

    // Report findings
    console.log('React loaded:', reactLoaded);
    console.log('Root element exists:', rootExists);
    console.log('Page errors:', errors);
    console.log('Module errors:', moduleErrors);

    // Assert no errors
    expect(errors).toHaveLength(0);
    expect(rootExists).toBe(true);
  });
});