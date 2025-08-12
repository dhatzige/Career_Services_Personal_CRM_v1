import { chromium } from 'playwright';

const browser = await chromium.launch({ 
  headless: false,
  devtools: true 
});

const context = await browser.newContext();
const page = await context.newPage();

// Enable console logging
page.on('console', msg => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error') {
    console.error('❌ Console Error:', text);
  } else if (type === 'warning') {
    console.warn('⚠️ Console Warning:', text);
  } else {
    console.log(`📝 Console ${type}:`, text);
  }
});

// Log network failures
page.on('requestfailed', request => {
  console.error('❌ Request failed:', request.url(), request.failure()?.errorText);
});

// Log page errors
page.on('pageerror', error => {
  console.error('❌ Page error:', error.message);
  console.error(error.stack);
});

console.log('🚀 Navigating to http://localhost:5173...');
try {
  await page.goto('http://localhost:5173', { 
    waitUntil: 'domcontentloaded',
    timeout: 10000 
  });
  
  console.log('✅ Page loaded');
  
  // Check React presence
  const reactInfo = await page.evaluate(() => {
    return {
      hasReact: typeof window.React !== 'undefined',
      hasReactDOM: typeof window.ReactDOM !== 'undefined',
      reactVersion: window.React?.version || 'Not found',
      rootElement: document.getElementById('root') !== null,
      rootHTML: document.getElementById('root')?.innerHTML?.substring(0, 200) || 'No root element',
      documentTitle: document.title,
      scriptsCount: document.scripts.length,
      bodyHTML: document.body.innerHTML.substring(0, 500)
    };
  });
  
  console.log('\n📊 React Status:');
  console.log('Has React:', reactInfo.hasReact);
  console.log('Has ReactDOM:', reactInfo.hasReactDOM);
  console.log('React Version:', reactInfo.reactVersion);
  console.log('Root Element Exists:', reactInfo.rootElement);
  console.log('Document Title:', reactInfo.documentTitle);
  console.log('Scripts Count:', reactInfo.scriptsCount);
  console.log('\nRoot HTML:', reactInfo.rootHTML);
  console.log('\nBody HTML (first 500 chars):', reactInfo.bodyHTML);
  
  // Wait for any async errors
  await page.waitForTimeout(5000);
  
} catch (error) {
  console.error('❌ Failed to load page:', error.message);
}

// Keep browser open for inspection
console.log('\n👀 Browser will stay open. Press Ctrl+C to close.');
await new Promise(() => {});