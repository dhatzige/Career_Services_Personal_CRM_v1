import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

async function applySupabaseMigration() {
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000 
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    console.log('🔄 Opening Supabase dashboard...');
    
    // Navigate to Supabase project
    await page.goto('https://supabase.com/dashboard/project/nhzuliqmjszibcbftjtq/editor');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Check if we need to sign in
    if (page.url().includes('sign-in') || page.url().includes('login')) {
      console.log('📝 Need to sign in to Supabase...');
      // The user might need to sign in manually
      console.log('⏸️  Please sign in to Supabase in the browser window');
      console.log('Press Enter when you have signed in...');
      
      // Wait for user to complete sign in
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
    
    // Navigate to SQL editor if not already there
    if (!page.url().includes('/editor')) {
      console.log('📍 Navigating to SQL editor...');
      await page.goto('https://supabase.com/dashboard/project/nhzuliqmjszibcbftjtq/editor');
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    }
    
    console.log('✅ In SQL editor');
    
    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.resolve(__dirname, '../../../safe_supabase_migration.sql'), 
      'utf-8'
    );
    
    // Find the SQL editor textarea - Supabase uses Monaco editor
    console.log('📝 Inserting migration SQL...');
    
    // Click on the editor to focus it
    await page.click('.monaco-editor', { timeout: 10000 });
    
    // Clear any existing content
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    // Type the migration SQL
    await page.keyboard.type(migrationSQL, { delay: 10 });
    
    console.log('🚀 Running migration...');
    
    // Find and click the Run button
    await page.click('button:has-text("Run")', { timeout: 10000 });
    
    // Wait for the query to complete
    await page.waitForTimeout(5000);
    
    // Check for success or error messages
    const successMessage = await page.locator('text=/Success|Executed successfully/i').count();
    const errorMessage = await page.locator('text=/Error|Failed/i').count();
    
    if (successMessage > 0) {
      console.log('✅ Migration completed successfully!');
      
      // Take a screenshot of the result
      await page.screenshot({ 
        path: path.resolve(__dirname, '../../../migration-success.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved as migration-success.png');
    } else if (errorMessage > 0) {
      console.log('❌ Migration may have encountered an error');
      const errorText = await page.locator('.text-red-500, .text-red-600').first().textContent();
      console.log('Error details:', errorText);
      
      // Take a screenshot of the error
      await page.screenshot({ 
        path: path.resolve(__dirname, '../../../migration-error.png'),
        fullPage: true 
      });
      console.log('📸 Screenshot saved as migration-error.png');
    } else {
      console.log('⚠️  Could not determine migration status');
      console.log('Please check the Supabase dashboard manually');
    }
    
    // Verify by checking the tags table
    console.log('\n🔍 Verifying migration...');
    
    // Clear editor and run a verification query
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Delete');
    
    const verificationSQL = `
      SELECT 
        'Tags table' as check_name,
        COUNT(*) as count
      FROM tags
      UNION ALL
      SELECT 
        'Consultation columns' as check_name,
        COUNT(*) as count
      FROM information_schema.columns 
      WHERE table_name = 'consultations' 
      AND column_name IN ('status', 'meeting_link', 'cancellation_reason');
    `;
    
    await page.keyboard.type(verificationSQL, { delay: 10 });
    await page.click('button:has-text("Run")');
    
    await page.waitForTimeout(3000);
    
    console.log('✅ Verification query executed');
    console.log('\n📋 Please check the results in the browser window');
    console.log('You should see:');
    console.log('- Tags table: 19 (or more) rows');
    console.log('- Consultation columns: 3 rows');
    
    console.log('\n🎉 Migration process completed!');
    console.log('Press Enter to close the browser...');
    
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.log('📸 Taking screenshot of current state...');
    
    const page = browser.contexts()[0]?.pages()[0];
    if (page) {
      await page.screenshot({ 
        path: path.resolve(__dirname, '../../../migration-error-state.png'),
        fullPage: true 
      });
      console.log('Screenshot saved as migration-error-state.png');
    }
  } finally {
    await browser.close();
  }
}

// Run the migration
console.log('🚀 Starting Supabase migration with Playwright...\n');
applySupabaseMigration().catch(console.error);