const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to login
  await page.goto('http://localhost:5175');
  console.log('Login page loaded');
  
  // Login
  await page.fill('input[type="email"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button[type="submit"]');
  
  // Wait for dashboard
  await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
    console.log('Waiting for main page instead...');
    return page.waitForURL('http://localhost:5175/', { timeout: 10000 });
  });
  
  console.log('Logged in successfully');
  
  // Navigate to Today's Schedule
  await page.click('text="Today\'s Schedule"');
  await page.waitForTimeout(2000);
  
  // Check what's on the page
  const hasConsultations = await page.locator('.consultation-card').count();
  const pageContent = await page.locator('main').textContent();
  
  console.log('Today\'s Schedule page content:', pageContent);
  console.log('Number of consultations found:', hasConsultations);
  
  // Take screenshot
  await page.screenshot({ path: 'todays-schedule.png', fullPage: true });
  console.log('Screenshot saved as todays-schedule.png');
  
  // Keep browser open for manual inspection
  console.log('Browser will stay open for manual testing...');
  await page.waitForTimeout(300000); // Keep open for 5 minutes
})();