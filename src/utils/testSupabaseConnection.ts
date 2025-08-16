import { supabase } from '../contexts/CleanSupabaseAuth';

export async function testSupabaseConnection() {
  console.log('🔍 Testing Supabase Connection...');
  
  try {
    // Test 1: Check if we can connect to Supabase
    const { data: _testConnection, error: connectionError } = await supabase
      .from('students')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Supabase connection failed:', connectionError);
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    
    // Test 2: Try to fetch students
    const { data: students, error: fetchError } = await supabase
      .from('students')
      .select('*')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Failed to fetch students:', fetchError);
      return false;
    }
    
    console.log('✅ Successfully fetched students:', students?.length || 0, 'students found');
    
    // Test 3: Test insert (with a fake email to avoid duplicates)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data: newStudent, error: insertError } = await supabase
      .from('students')
      .insert({
        first_name: 'Test',
        last_name: 'Student',
        email: testEmail,
        year_of_study: '1st year',
        program_type: "Bachelor's",
        specific_program: 'Computer Science',
        status: 'Active'
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Failed to insert test student:', insertError);
      return false;
    }
    
    console.log('✅ Successfully created test student:', newStudent);
    
    // Test 4: Delete the test student
    const { error: deleteError } = await supabase
      .from('students')
      .delete()
      .eq('id', newStudent.id);
    
    if (deleteError) {
      console.error('❌ Failed to delete test student:', deleteError);
      return false;
    }
    
    console.log('✅ Successfully deleted test student');
    console.log('🎉 All Supabase tests passed!');
    
    return true;
  } catch (error) {
    console.error('❌ Unexpected error during Supabase test:', error);
    return false;
  }
}

// Function to check all data operations
export async function verifySupabaseOperations() {
  console.log('🔍 Verifying all Supabase operations...\n');
  
  const operations = {
    students: false,
    notes: false,
    consultations: false,
    applications: false,
    workshops: false
  };
  
  // Check students table
  try {
    const { error } = await supabase.from('students').select('id').limit(1);
    operations.students = !error;
    console.log(`Students table: ${operations.students ? '✅' : '❌'} ${error?.message || ''}`);
  } catch (e) {
    console.log('Students table: ❌', e);
  }
  
  // Check notes table
  try {
    const { error } = await supabase.from('notes').select('id').limit(1);
    operations.notes = !error;
    console.log(`Notes table: ${operations.notes ? '✅' : '❌'} ${error?.message || ''}`);
  } catch (e) {
    console.log('Notes table: ❌', e);
  }
  
  // Check consultations table
  try {
    const { error } = await supabase.from('consultations').select('id').limit(1);
    operations.consultations = !error;
    console.log(`Consultations table: ${operations.consultations ? '✅' : '❌'} ${error?.message || ''}`);
  } catch (e) {
    console.log('Consultations table: ❌', e);
  }
  
  // Check applications table
  try {
    const { error } = await supabase.from('applications').select('id').limit(1);
    operations.applications = !error;
    console.log(`Applications table: ${operations.applications ? '✅' : '❌'} ${error?.message || ''}`);
  } catch (e) {
    console.log('Applications table: ❌', e);
  }
  
  // Check workshops table
  try {
    const { error } = await supabase.from('workshop_attendance').select('id').limit(1);
    operations.workshops = !error;
    console.log(`Workshop attendance table: ${operations.workshops ? '✅' : '❌'} ${error?.message || ''}`);
  } catch (e) {
    console.log('Workshop attendance table: ❌', e);
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total operations working: ${Object.values(operations).filter(v => v).length}/${Object.keys(operations).length}`);
  
  return operations;
}

// Add to window for easy testing in console
if (typeof window !== 'undefined') {
  (window as any).testSupabase = testSupabaseConnection;
  (window as any).verifySupabase = verifySupabaseOperations;
}