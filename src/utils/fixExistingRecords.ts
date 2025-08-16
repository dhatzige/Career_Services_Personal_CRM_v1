import { supabase } from '../contexts/CleanSupabaseAuth';

export async function fixExistingRecords() {
  console.log('=== Fixing Existing Records ===');
  
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No user logged in');
      return { success: false, error: 'No user logged in' };
    }
    
    console.log('Current user ID:', user.id);
    
    // Fix notes without created_by
    console.log('\n--- Updating notes without created_by ---');
    const { data: notesUpdated, error: notesError } = await supabase
      .from('notes')
      .update({ created_by: user.id })
      .is('created_by', null)
      .select();
    
    if (notesError) {
      console.error('Error updating notes:', notesError);
    } else {
      console.log(`Updated ${notesUpdated?.length || 0} notes`);
    }
    
    // Fix consultations without created_by
    console.log('\n--- Updating consultations without created_by ---');
    const { data: consultationsUpdated, error: consultationsError } = await supabase
      .from('consultations')
      .update({ created_by: user.id })
      .is('created_by', null)
      .select();
    
    if (consultationsError) {
      console.error('Error updating consultations:', consultationsError);
    } else {
      console.log(`Updated ${consultationsUpdated?.length || 0} consultations`);
    }
    
    // Also update any records that have empty string as created_by
    console.log('\n--- Updating records with empty created_by ---');
    
    const { data: notesEmpty, error: notesEmptyError } = await supabase
      .from('notes')
      .update({ created_by: user.id })
      .eq('created_by', '')
      .select();
      
    const { data: consultationsEmpty, error: consultationsEmptyError } = await supabase
      .from('consultations')
      .update({ created_by: user.id })
      .eq('created_by', '')
      .select();
    
    console.log(`Updated ${notesEmpty?.length || 0} notes with empty created_by`);
    console.log(`Updated ${consultationsEmpty?.length || 0} consultations with empty created_by`);
    
    console.log('\n=== Fix Complete ===');
    return { 
      success: true, 
      notesFixed: (notesUpdated?.length || 0) + (notesEmpty?.length || 0),
      consultationsFixed: (consultationsUpdated?.length || 0) + (consultationsEmpty?.length || 0)
    };
    
  } catch (error) {
    console.error('Fix error:', error);
    return { success: false, error };
  }
}