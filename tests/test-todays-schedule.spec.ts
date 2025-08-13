import { test, expect } from '@playwright/test';

test.describe('Today\'s Schedule', () => {
  test('should show today\'s consultations', async ({ page }) => {
    // Go to login page
    await page.goto('http://localhost:5175/login');
    
    // Login with credentials
    await page.fill('input[type="email"]', 'dhatzige@act.edu');
    await page.fill('input[type="password"]', '!)DQeop4');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('http://localhost:5175/', { timeout: 10000 });
    
    // Navigate to Today's Schedule
    await page.click('text="Today\'s Schedule"');
    
    // Wait for the page to load
    await page.waitForTimeout(2000);
    
    // Check if consultations are loaded
    const pageContent = await page.content();
    console.log('Today\'s Schedule loaded');
    
    // Look for consultation data or "No consultations" message
    const hasConsultations = await page.locator('.consultation-card, text=/Resume Review|General|12:00/').count();
    const hasNoConsultations = await page.locator('text="No consultations scheduled for today"').count();
    
    console.log(`Found ${hasConsultations} consultations`);
    console.log(`Has "no consultations" message: ${hasNoConsultations > 0}`);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'todays-schedule-test.png', fullPage: true });
    
    // Check that either we have consultations or a "no consultations" message
    expect(hasConsultations + hasNoConsultations).toBeGreaterThan(0);
  });
});