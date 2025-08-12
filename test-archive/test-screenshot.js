import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Going to app...');
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(3000);
  
  // Take screenshot of current state
  await page.screenshot({ path: 'current-state.png', fullPage: true });
  console.log('Screenshot saved: current-state.png');
  
  // Log current URL
  console.log('Current URL:', page.url());
  
  // List all visible links
  const links = await page.$$eval('a', links => links.map(link => ({
    text: link.textContent,
    href: link.href
  })));
  console.log('Visible links:', links);
  
  // Try to go directly to students page
  console.log('Going directly to students page...');
  await page.goto('http://localhost:5173/students');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'students-direct.png', fullPage: true });
  console.log('Students page screenshot: students-direct.png');
  
  await browser.close();
})();