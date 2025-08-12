import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'current-state.png', fullPage: true });

console.log('Screenshot saved to current-state.png');

await browser.close();