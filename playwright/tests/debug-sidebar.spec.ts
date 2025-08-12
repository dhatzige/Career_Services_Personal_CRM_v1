import { test } from '@playwright/test';

test('Debug Sidebar Loading', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  
  // Login
  await page.goto('http://localhost:5173/login');
  await page.fill('input[placeholder*="example.com"]', 'dhatzige@act.edu');
  await page.fill('input[type="password"]', '!)DQeop4');
  await page.click('button:has-text("Sign In")');
  await page.waitForURL('http://localhost:5173/');
  
  // Wait for potential loading states
  await page.waitForTimeout(3000);
  
  // Debug what's in the page
  const navExists = await page.locator('nav').count();
  console.log('Nav elements:', navExists);
  
  const allLinks = await page.locator('a').allTextContents();
  console.log('All links on page:', allLinks);
  
  const sidebarLinks = await page.locator('nav a').allTextContents();
  console.log('Sidebar links:', sidebarLinks);
  
  // Check if there's a loading state
  const loading = await page.locator('.loading, .spinner, [aria-busy="true"]').count();
  console.log('Loading elements:', loading);
  
  // Get page HTML
  const bodyHTML = await page.locator('body').innerHTML();
  console.log('Body has content:', bodyHTML.length > 100);
  
  // Try evaluating in page context
  const sidebarInfo = await page.evaluate(() => {
    const nav = document.querySelector('nav');
    const links = nav ? nav.querySelectorAll('a') : [];
    return {
      navFound: !!nav,
      linkCount: links.length,
      linkTexts: Array.from(links).map(l => l.textContent?.trim()),
      firstLinkHref: links[0]?.href,
      navDisplay: nav ? window.getComputedStyle(nav).display : 'not found',
      navVisibility: nav ? window.getComputedStyle(nav).visibility : 'not found'
    };
  });
  
  console.log('Sidebar info:', sidebarInfo);
  
  await page.screenshot({ path: 'debug-sidebar.png', fullPage: true });
});