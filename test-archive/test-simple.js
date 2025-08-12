import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500,
    args: ['--window-size=1400,900']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  
  const page = await context.newPage();
  
  try {
    // Go to app
    console.log('1. Going to app...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // Login if needed
    if (page.url().includes('login')) {
      console.log('2. Logging in...');
      await page.fill('input[type="email"]', 'dhatzige@act.edu');
      await page.fill('input[type="password"]', '!)DQeop4');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'dashboard-view.png', fullPage: true });
    console.log('3. Dashboard screenshot taken');
    
    // Check if there's a mobile menu button
    const menuButton = await page.$('button[aria-label*="menu"], button:has(svg.lucide-menu)');
    if (menuButton) {
      console.log('4. Found mobile menu button, clicking...');
      await menuButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'menu-opened.png' });
    }
    
    // Try different ways to get to students
    console.log('5. Trying to navigate to students...');
    
    // Method 1: Direct navigation
    await page.goto('http://localhost:5173/students');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'students-direct-nav.png' });
    
    // Check what we have on the page
    const hasStudents = await page.$('table, div:has-text("No students")');
    console.log('6. Has students content:', !!hasStudents);
    
    // Look for visible buttons
    const visibleButtons = await page.$$('button:visible');
    console.log(`7. Found ${visibleButtons.length} visible buttons`);
    
    for (let i = 0; i < Math.min(5, visibleButtons.length); i++) {
      const text = await visibleButtons[i].textContent();
      const ariaLabel = await visibleButtons[i].getAttribute('aria-label');
      console.log(`   Button ${i}: text="${text}", aria-label="${ariaLabel}"`);
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'error-simple.png' });
  }
  
  console.log('Keeping browser open...');
  await page.waitForTimeout(30000);
  await browser.close();
})();