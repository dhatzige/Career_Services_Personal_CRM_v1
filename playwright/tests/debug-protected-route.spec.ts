import { test } from '@playwright/test';

test('Debug protected route and auth flow', async ({ page }) => {
  // Enable all console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
  });

  // First check if we can access root without login
  console.log('1. Trying to access root without login...');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);
  
  const urlAfterRoot = page.url();
  console.log('URL after accessing root:', urlAfterRoot);
  
  if (urlAfterRoot.includes('login')) {
    console.log('✅ Correctly redirected to login (protected route working)');
    
    // Now login
    console.log('\n2. Logging in...');
    await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
    await page.fill('input[type="password"]', '!)DQeop4');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForTimeout(3000);
    console.log('URL after login:', page.url());
    
    // Check auth state
    const authState = await page.evaluate(() => {
      // Check localStorage for auth tokens
      const localStorage = window.localStorage;
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(k => k.includes('auth') || k.includes('supabase'));
      
      return {
        authKeys,
        hasAuthToken: authKeys.length > 0,
        pathname: window.location.pathname
      };
    });
    
    console.log('Auth state:', authState);
    
    // Try to get React component state
    const reactState = await page.evaluate(() => {
      // Try to find React root
      const root = document.getElementById('root');
      if (!root) return { error: 'No root element' };
      
      // Check if React is rendering anything
      return {
        hasChildren: root.children.length > 0,
        innerHTML: root.innerHTML.substring(0, 200),
        childCount: root.children.length
      };
    });
    
    console.log('React render state:', reactState);
  }
  
  await page.screenshot({ path: 'debug-auth-flow.png' });
});