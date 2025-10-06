import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🔄 Starting Supabase migration...');
    
    // Read the migration SQL file
    const migrationSQL = fs.readFileSync(
      path.resolve(__dirname, '../../../safe_supabase_migration.sql'), 
      'utf-8'
    );
    
    // First, let's check current schema
    console.log('📋 Checking current schema...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'consultations' });
    
    if (columnsError) {
      console.log('Note: Could not check existing columns, proceeding with migration');
    } else {
      console.log('Current consultation columns:', columns?.map((c: any) => c.column_name).join(', '));
    }
    
    // Apply the migration
    console.log('🚀 Applying migration...');
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: migrationSQL 
    });
    
    if (error) {
      // If direct SQL execution fails, try breaking it into smaller chunks
      console.log('Direct SQL execution not available, trying alternative approach...');
      
      // Test if we can at least query the database
      const { data: testData, error: testError } = await supabase
        .from('consultations')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('❌ Database connection error:', testError);
        return;
      }
      
      console.log('✅ Database connection successful');
      console.log('\n📝 Please run the following SQL in your Supabase SQL Editor:');
      console.log('File location: safe_supabase_migration.sql');
      console.log('\nThe migration script will:');
      console.log('- Add status tracking to consultations');
      console.log('- Create tags system');
      console.log('- Add 19 default tags');
      console.log('- Update existing consultations with appropriate status');
      
      return;
    }
    
    console.log('✅ Migration applied successfully!');
    
    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    // Check if tags were created
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .order('name');
      
    if (!tagsError && tags) {
      console.log(`✅ Created ${tags.length} tags`);
      console.log('Tags:', tags.map(t => `${t.icon} ${t.name}`).join(', '));
    }
    
    // Check if new columns exist
    const { data: updatedConsultation, error: consultError } = await supabase
      .from('consultations')
      .select('id, status, meeting_link')
      .limit(1);
      
    if (!consultError) {
      console.log('✅ New consultation columns added successfully');
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('\n📝 Please manually run the migration in Supabase SQL Editor');
    console.log('File: safe_supabase_migration.sql');
  }
}

// Run the migration
applyMigration();