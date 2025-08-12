import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function setupSupabase() {
  console.log('🚀 Setting up Supabase database...\n');

  // Check for required environment variables
  if (!SUPABASE_URL) {
    console.error('❌ SUPABASE_URL is not set in .env file');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY is not set in .env file');
    console.log('\n📝 To get your service key:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy the "service_role" key (keep this secret!)');
    console.log('5. Add it to backend/.env as SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // Initialize Supabase client with service key
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Test connection
    console.log('📡 Testing connection to Supabase...');
    const { data, error } = await supabase.from('students').select('count').limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 = table doesn't exist
      console.error('❌ Failed to connect to Supabase:', error.message);
      process.exit(1);
    }

    console.log('✅ Connected to Supabase successfully!\n');

    // Read migration SQL
    const migrationPath = path.join(__dirname, '../src/database/supabase-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('🏗️  Running database migrations...\n');

    // Split SQL statements and execute them
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      // Extract table/operation info for logging
      let operation = 'SQL Statement';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
        operation = `Create table: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE INDEX')) {
        const match = statement.match(/CREATE INDEX (?:IF NOT EXISTS )?(\w+)/i);
        operation = `Create index: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE POLICY')) {
        const match = statement.match(/CREATE POLICY "([^"]+)"/i);
        operation = `Create policy: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE TRIGGER')) {
        const match = statement.match(/CREATE TRIGGER (\w+)/i);
        operation = `Create trigger: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('CREATE FUNCTION')) {
        const match = statement.match(/CREATE (?:OR REPLACE )?FUNCTION (\w+)/i);
        operation = `Create function: ${match ? match[1] : 'unknown'}`;
      } else if (statement.includes('ALTER TABLE')) {
        const match = statement.match(/ALTER TABLE (\w+)/i);
        operation = `Alter table: ${match ? match[1] : 'unknown'}`;
      }

      try {
        // Execute via Supabase's SQL function
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        }).single();

        if (error) {
          // Try direct execution as fallback
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_SERVICE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sql_query: statement })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }

        console.log(`✅ ${operation}`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ ${operation}`);
        console.error(`   Error: ${error.message}\n`);
        errorCount++;
        
        // Continue with other statements even if one fails
        // (tables might already exist, etc.)
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    // Verify tables were created
    console.log('\n🔍 Verifying database schema...\n');
    
    const tables = [
      'students',
      'notes',
      'consultations',
      'applications',
      'mock_interviews',
      'career_documents',
      'employer_connections',
      'follow_up_reminders',
      'users'
    ];

    let tablesFound = 0;
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          console.log(`✅ Table '${table}' exists`);
          tablesFound++;
        } else {
          console.log(`❌ Table '${table}' not found`);
        }
      } catch (error) {
        console.log(`❌ Table '${table}' not found`);
      }
    }

    console.log(`\n✅ Setup complete! Found ${tablesFound}/${tables.length} tables.`);
    
    if (tablesFound === tables.length) {
      console.log('\n🎉 Your Supabase database is ready for production!');
      console.log('\n📝 Next steps:');
      console.log('1. Set USE_SUPABASE=true in your .env file');
      console.log('2. Restart your backend server');
      console.log('3. Your app will now use Supabase instead of SQLite');
    } else {
      console.log('\n⚠️  Some tables are missing. You may need to:');
      console.log('1. Check the Supabase dashboard for errors');
      console.log('2. Run the migration SQL manually in the SQL editor');
      console.log('3. Make sure you have the correct permissions');
    }

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupSupabase().catch(console.error);