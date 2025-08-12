import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  
  const page = await browser.newPage();
  
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
    
    // Click Students in the sidebar using a more specific selector
    console.log('3. Clicking Students in sidebar...');
    await page.click('nav a:has-text("Students")'); // More specific: nav link
    await page.waitForTimeout(2000);
    
    console.log('4. Current URL:', page.url());
    await page.screenshot({ path: 'students-page-current.png' });
    
    // Check current state of students page
    const pageContent = await page.textContent('body');
    console.log('5. Page contains "No students":', pageContent.includes('No students'));
    console.log('6. Page contains "Table":', pageContent.includes('Table'));
    
    // Look for any Add Student button
    const addButtons = await page.$$('button');
    console.log(`7. Found ${addButtons.length} buttons total`);
    
    for (let i = 0; i < addButtons.length; i++) {
      const text = await addButtons[i].textContent();
      if (text && text.includes('Add') && text.includes('Student')) {
        console.log(`   Button ${i}: "${text}"`);
      }
    }
    
    // If there's an "Add Your First Student" button, click it
    const addFirstStudent = await page.$('button:has-text("Add Your First Student")');
    if (addFirstStudent) {
      console.log('8. Clicking Add Your First Student...');
      await addFirstStudent.click();
      await page.waitForTimeout(1000);
      
      // Fill form
      await page.fill('input[name="firstName"]', 'John');
      await page.fill('input[name="lastName"]', 'Smith');
      await page.fill('input[name="email"]', 'john.smith@university.edu');
      await page.screenshot({ path: 'add-student-filled.png' });
      
      // Look for the submit button more carefully
      const modalButtons = await page.$$('div[role="dialog"] button, div.fixed button');
      console.log(`9. Found ${modalButtons.length} buttons in modal`);
      
      for (let i = 0; i < modalButtons.length; i++) {
        const text = await modalButtons[i].textContent();
        console.log(`   Modal button ${i}: "${text}"`);
        if (text === 'Add Student') {
          await modalButtons[i].click();
          console.log('   Clicked Add Student!');
          break;
        }
      }
      
      await page.waitForTimeout(3000);
    }
    
    // Now check if we have students and can switch to table view
    await page.screenshot({ path: 'after-add-student.png' });
    
    const tableButton = await page.$('button:has-text("Table"):visible');
    if (tableButton) {
      console.log('10. Found Table button, clicking...');
      await tableButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'table-view-active.png' });
      
      // Now test the dropdowns
      console.log('11. Looking for table rows...');
      const rows = await page.$$('tbody tr');
      console.log(`    Found ${rows.length} rows`);
      
      if (rows.length > 0) {
        // Get first row cells
        const cells = await rows[0].$$('td');
        console.log(`12. First row has ${cells.length} cells`);
        
        // Quick Note is typically 3rd cell
        if (cells.length >= 3) {
          const quickNoteButton = await cells[2].$('button');
          if (quickNoteButton) {
            console.log('13. Clicking Quick Note button...');
            await quickNoteButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'quick-note-clicked.png' });
            
            // Look everywhere for the dropdown
            const dropdownSelectors = [
              'button:has-text("General Note")',
              'div[role="menu"] button',
              'body > div button',
              '.absolute button'
            ];
            
            for (const selector of dropdownSelectors) {
              const items = await page.$$(selector);
              if (items.length > 0) {
                console.log(`14. Found ${items.length} items with selector: ${selector}`);
                for (let i = 0; i < Math.min(3, items.length); i++) {
                  const text = await items[i].textContent();
                  console.log(`    Item ${i}: "${text}"`);
                }
                break;
              }
            }
          }
        }
      }
    } else {
      console.log('No Table button found');
    }
    
    await page.screenshot({ path: 'final-state-debug.png', fullPage: true });
    console.log('Test complete!');
    
  } catch (error) {
    console.error('ERROR:', error.message);
    await page.screenshot({ path: 'error-debug.png' });
  }
  
  await page.waitForTimeout(30000);
  await browser.close();
})();