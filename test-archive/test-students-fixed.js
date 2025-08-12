import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log all console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  try {
    console.log('1. Going to app...');
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(2000);
    
    // We should be on dashboard now based on previous screenshot
    console.log('2. Clicking Students in sidebar...');
    await page.click('text=Students');
    await page.waitForTimeout(2000);
    
    console.log('3. Current URL:', page.url());
    await page.screenshot({ path: 'students-page.png' });
    
    // Check if we need to add a student first
    const emptyState = await page.$('text=No students yet');
    if (emptyState) {
      console.log('4. No students found, adding one...');
      await page.click('button:has-text("Add Student")');
      await page.waitForTimeout(1000);
      
      // Fill in student form
      await page.fill('input[placeholder*="First"]', 'Test');
      await page.fill('input[placeholder*="Last"]', 'Student');
      await page.fill('input[placeholder*="Email"]', 'test@example.com');
      
      await page.screenshot({ path: 'add-student-form.png' });
      
      // Find and click the submit button
      const submitButton = await page.$('button:has-text("Add Student"):not(:has-text("First"))');
      if (submitButton) {
        await submitButton.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Now switch to table view
    console.log('5. Switching to table view...');
    const tableButton = await page.$('button:has-text("Table")');
    if (tableButton) {
      await tableButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'table-view.png' });
      
      // Find student rows
      const rows = await page.$$('tbody tr');
      console.log(`6. Found ${rows.length} student rows`);
      
      if (rows.length > 0) {
        // Look for dropdown buttons in the first row
        const firstRow = rows[0];
        
        // Get all buttons in the row
        const buttons = await firstRow.$$('button');
        console.log(`7. Found ${buttons.length} buttons in first row`);
        
        // Try clicking each button to see what happens
        for (let i = 0; i < buttons.length; i++) {
          console.log(`8. Clicking button ${i + 1}...`);
          await buttons[i].click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: `button-${i + 1}-clicked.png` });
          
          // Check if any dropdown appeared
          const dropdowns = await page.$$('.absolute.z-50');
          console.log(`   Found ${dropdowns.length} dropdowns`);
          
          // Check for portal-rendered dropdowns
          const portalDropdowns = await page.$$('body > div:not(#root)');
          console.log(`   Found ${portalDropdowns.length} portal elements`);
          
          // Click somewhere else to close dropdown
          await page.click('body');
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('No table button found');
      await page.screenshot({ path: 'no-table-button.png' });
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-page.png', fullPage: true });
    
  } catch (error) {
    console.error('ERROR:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }
  
  console.log('Test complete. Keeping browser open for 30 seconds...');
  await page.waitForTimeout(30000);
  await browser.close();
})();