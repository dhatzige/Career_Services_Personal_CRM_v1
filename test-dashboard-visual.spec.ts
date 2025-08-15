import { test, expect } from '@playwright/test';

test('Visual verification of dashboard legend text in dark mode', async ({ page }) => {
  // Navigate to the app
  await page.goto('http://localhost:5173');
  
  // Log in with provided credentials
  await page.fill('input[type="email"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard to load
  await page.waitForURL('http://localhost:5173/');
  await page.waitForSelector('[data-testid="dashboard"], .dashboard, h1:has-text("Dashboard")', { timeout: 10000 });
  
  // Take screenshot of dashboard in light mode
  await page.screenshot({ path: 'dashboard-light-mode.png', fullPage: true });
  
  // Toggle to dark mode
  await page.click('button[aria-label="Toggle theme"], [aria-label*="theme"], [title*="theme"]');
  await page.waitForTimeout(1000);
  
  // Take screenshot of dashboard in dark mode
  await page.screenshot({ path: 'dashboard-dark-mode.png', fullPage: true });
  
  // Look for legend text visibility issues
  const legendTexts = await page.locator('text="Master\'s - 1st year"').all();
  console.log(`Found ${legendTexts.length} legend text elements`);
  
  for (let i = 0; i < legendTexts.length; i++) {
    const computedStyle = await legendTexts[i].evaluate(el => {
      const style = window.getComputedStyle(el);
      return {
        color: style.color,
        backgroundColor: style.backgroundColor,
        visibility: style.visibility,
        opacity: style.opacity
      };
    });
    console.log(`Legend text ${i + 1} style:`, computedStyle);
  }
});