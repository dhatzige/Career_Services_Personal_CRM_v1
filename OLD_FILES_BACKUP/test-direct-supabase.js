require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with anon key for auth
const supabaseAuth = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Create Supabase client with service role for data operations
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testSupabaseOperations() {
  try {
    console.log('1. Testing direct Supabase authentication...');
    
    // Login with master account
    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({
      email: 'dhatzige@act.edu',
      password: '!)DQeop4'
    });
    
    if (authError) {
      console.error('Login error:', authError);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('User ID:', authData.user.id);
    console.log('Email:', authData.user.email);
    console.log('Session:', authData.session ? 'Active' : 'None');
    
    // Test user data access
    console.log('\n2. Checking user in database...');
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('supabase_id', authData.user.id)
      .single();
    
    if (userError) {
      console.error('User lookup error:', userError);
      return;
    }
    
    console.log('✅ User found in database:');
    console.log('- Database ID:', userData.id);
    console.log('- Role:', userData.role);
    console.log('- Active:', userData.is_active);
    
    // Test student operations
    console.log('\n3. Testing student operations...');
    
    // Create a test student
    const testStudent = {
      id: require('crypto').randomUUID(),
      first_name: 'Test',
      last_name: 'Student',
      email: 'test.student@example.com',
      phone: '+1234567890',
      year_of_study: '2nd year',
      major: 'Business',
      status: 'Active',
      resume_on_file: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newStudent, error: createError } = await supabaseAdmin
      .from('students')
      .insert(testStudent)
      .select()
      .single();
    
    if (createError) {
      console.error('Create student error:', createError);
      return;
    }
    
    console.log('✅ Student created:', newStudent.id);
    
    // Get all students
    const { data: students, error: listError } = await supabaseAdmin
      .from('students')
      .select('*')
      .limit(5);
    
    if (listError) {
      console.error('List students error:', listError);
    } else {
      console.log(`✅ Found ${students.length} students`);
    }
    
    // Delete test student
    const { error: deleteError } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', newStudent.id);
    
    if (deleteError) {
      console.error('Delete student error:', deleteError);
    } else {
      console.log('✅ Test student deleted');
    }
    
    console.log('\n✅ All Supabase operations completed successfully!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testSupabaseOperations();