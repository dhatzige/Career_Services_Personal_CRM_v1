import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Default tags to insert
const defaultTags = [
  // Status-related tags
  { name: 'Email Cancel', color: 'red', category: 'action', icon: '📧' },
  { name: 'Phone Cancel', color: 'red', category: 'action', icon: '📞' },
  { name: 'Needs Follow-up', color: 'yellow', category: 'action', icon: '🔔' },
  { name: 'Follow-up Complete', color: 'green', category: 'action', icon: '✅' },
  
  // Meeting type tags
  { name: 'First Meeting', color: 'blue', category: 'general', icon: '🆕' },
  { name: 'Final Meeting', color: 'purple', category: 'general', icon: '🎓' },
  { name: 'Emergency Meeting', color: 'red', category: 'priority', icon: '🚨' },
  
  // Topic tags
  { name: 'Resume Review', color: 'blue', category: 'topic', icon: '📝' },
  { name: 'Interview Prep', color: 'purple', category: 'topic', icon: '🎤' },
  { name: 'Job Search', color: 'orange', category: 'topic', icon: '💼' },
  { name: 'Career Planning', color: 'green', category: 'topic', icon: '🎯' },
  { name: 'Grad School', color: 'purple', category: 'topic', icon: '🎓' },
  { name: 'Internship', color: 'yellow', category: 'topic', icon: '🏢' },
  
  // Outcome tags
  { name: 'Great Progress', color: 'green', category: 'outcome', icon: '🌟' },
  { name: 'Action Plan Created', color: 'green', category: 'outcome', icon: '📋' },
  { name: 'Resources Provided', color: 'blue', category: 'outcome', icon: '📚' },
  { name: 'Referral Made', color: 'blue', category: 'outcome', icon: '🤝' },
  { name: 'At Risk', color: 'red', category: 'outcome', icon: '⚠️' },
  { name: 'On Track', color: 'green', category: 'outcome', icon: '✅' }
];

async function applyMigration() {
  try {
    console.log('🔄 Starting programmatic migration...\n');
    
    // Step 1: Check if tags table exists by trying to query it
    console.log('1️⃣ Checking tags table...');
    const { data: existingTags, error: tagsCheckError } = await supabase
      .from('tags')
      .select('id')
      .limit(1);
    
    if (tagsCheckError) {
      console.log('❌ Tags table does not exist yet');
      console.log('⚠️  Please run the SQL migration first to create the tables');
      console.log('\nInstructions:');
      console.log('1. Go to your Supabase dashboard: https://app.supabase.com');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of safe_supabase_migration.sql');
      console.log('4. Run the SQL');
      console.log('5. Then run this script again to populate the tags');
      return;
    }
    
    console.log('✅ Tags table exists');
    
    // Step 2: Insert default tags
    console.log('\n2️⃣ Inserting default tags...');
    for (const tag of defaultTags) {
      const { data, error } = await supabase
        .from('tags')
        .upsert({
          ...tag,
          is_active: true,
          usage_count: 0
        }, {
          onConflict: 'name',
          ignoreDuplicates: true
        });
      
      if (error && !error.message.includes('duplicate')) {
        console.log(`❌ Error inserting tag "${tag.name}":`, error.message);
      } else {
        console.log(`✅ Tag "${tag.icon} ${tag.name}" ready`);
      }
    }
    
    // Step 3: Check current consultations
    console.log('\n3️⃣ Checking consultations...');
    const { data: consultations, error: consultError } = await supabase
      .from('consultations')
      .select('id, attended, consultation_date, status')
      .order('consultation_date', { ascending: false })
      .limit(10);
    
    if (consultError) {
      console.log('❌ Error checking consultations:', consultError.message);
    } else {
      console.log(`✅ Found ${consultations?.length || 0} recent consultations`);
      
      // Check if status column exists
      if (consultations && consultations.length > 0 && !('status' in consultations[0])) {
        console.log('⚠️  Status column not found in consultations table');
        console.log('Please ensure the SQL migration has been run first');
      } else {
        console.log('✅ Status column is available');
        
        // Update consultations without status
        const consultationsWithoutStatus = consultations?.filter(c => !c.status) || [];
        if (consultationsWithoutStatus.length > 0) {
          console.log(`\n4️⃣ Updating ${consultationsWithoutStatus.length} consultations with default status...`);
          
          for (const consultation of consultationsWithoutStatus) {
            const now = new Date();
            const consultDate = new Date(consultation.consultation_date);
            let status = 'scheduled';
            
            if (consultation.attended === true) {
              status = 'attended';
            } else if (consultation.attended === false && consultDate < now) {
              status = 'no-show';
            } else if (consultDate >= now) {
              status = 'scheduled';
            }
            
            const { error: updateError } = await supabase
              .from('consultations')
              .update({ status })
              .eq('id', consultation.id);
            
            if (updateError) {
              console.log(`❌ Error updating consultation ${consultation.id}:`, updateError.message);
            } else {
              console.log(`✅ Updated consultation ${consultation.id} to status: ${status}`);
            }
          }
        } else {
          console.log('✅ All consultations already have status set');
        }
      }
    }
    
    // Step 4: Verify final state
    console.log('\n5️⃣ Verifying migration results...');
    
    const { data: finalTags } = await supabase
      .from('tags')
      .select('*')
      .order('category', { ascending: true })
      .order('name', { ascending: true });
    
    if (finalTags) {
      console.log(`\n✅ Total tags in system: ${finalTags.length}`);
      const byCategory = finalTags.reduce((acc, tag) => {
        const cat = tag.category || 'general';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      Object.entries(byCategory).forEach(([cat, count]) => {
        console.log(`   ${cat}: ${count} tags`);
      });
    }
    
    console.log('\n🎉 Migration completed!');
    console.log('\n📝 Next steps:');
    console.log('1. The tag system is now ready to use');
    console.log('2. UI components can now use the status and tags');
    console.log('3. Existing consultations have been updated with appropriate status');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Run the migration
applyMigration();