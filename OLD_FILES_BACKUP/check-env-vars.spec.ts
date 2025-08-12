import { test } from '@playwright/test';

test('Check environment variables', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  
  // Check if Supabase is initialized correctly
  const envCheck = await page.evaluate(() => {
    // Check for environment variables in different ways
    const checks: any = {};
    
    // Method 1: Check window object
    // @ts-ignore
    if (window.__VITE_SUPABASE_URL__) {
      // @ts-ignore
      checks.windowUrl = window.__VITE_SUPABASE_URL__;
    }
    
    // Method 2: Check localStorage
    const storedUrl = localStorage.getItem('supabase.url');
    if (storedUrl) {
      checks.localStorageUrl = storedUrl;
    }
    
    // Method 3: Check if there's a global supabase instance
    // @ts-ignore
    if (window.supabase) {
      checks.globalSupabase = 'exists';
    }
    
    return checks;
  });
  
  console.log('Environment variables check:', envCheck);
  
  // Check if Supabase client is initialized
  const supabaseCheck = await page.evaluate(() => {
    try {
      // @ts-ignore
      const supabase = window.supabase;
      if (supabase) {
        return {
          exists: true,
          // @ts-ignore
          url: supabase.supabaseUrl || 'URL_NOT_ACCESSIBLE'
        };
      }
      return { exists: false };
    } catch (e) {
      return { exists: false, error: e.message };
    }
  });
  
  console.log('Supabase client check:', supabaseCheck);
  
  // Check network requests
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      console.log('Supabase request:', request.method(), request.url());
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('supabase')) {
      console.log('Supabase response:', response.status(), response.url());
    }
  });
  
  // Try to check React component state
  await page.evaluate(() => {
    console.log('Checking for Supabase configuration...');
  });
  
  await page.waitForTimeout(2000);
});