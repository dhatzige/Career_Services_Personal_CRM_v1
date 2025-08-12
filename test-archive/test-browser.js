import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console messages
  page.on('console', msg => {
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });

  // Log page errors
  page.on('pageerror', error => {
    console.error('Page error:', error.message);
  });

  // Navigate to the app
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });

  // Check if React is loaded
  const reactCheck = await page.evaluate(() => {
    return {
      hasReact: typeof window.React !== 'undefined',
      hasReactDOM: typeof window.ReactDOM !== 'undefined',
      rootElement: document.getElementById('root'),
      rootContent: document.getElementById('root')?.innerHTML || 'No content'
    };
  });

  console.log('React check:', reactCheck);

  // Wait a bit to see if there are any delayed errors
  await page.waitForTimeout(3000);

  await browser.close();
})();