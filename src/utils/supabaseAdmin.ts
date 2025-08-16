import { createClient } from '@supabase/supabase-js';

// This creates a Supabase client that bypasses RLS
// USE WITH EXTREME CAUTION - Only for admin operations
export function createAdminClient() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseServiceKey) {
    console.warn('Service role key not found. Admin operations will not work.');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Safer alternative: Use the anon key but with explicit user context
export async function deleteWithUserContext(table: string, id: string, userId: string) {
  const { supabase } = await import('../contexts/CleanSupabaseAuth');
  
  try {
    // First verify the user owns the record or has permission
    const { data: record, error: fetchError } = await supabase
      .from(table)
      .select('*')
      .eq('id', id)
      .single();
      
    if (fetchError || !record) {
      console.error('Record not found:', fetchError);
      return { error: 'Record not found' };
    }
    
    // Log the record details
    console.log('Record to delete:', record);
    console.log('Record created_by:', record.created_by);
    console.log('Current user:', userId);
    
    // Try to delete with explicit user context
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();
      
    return { data, error };
  } catch (error) {
    console.error('Delete error:', error);
    return { error };
  }
}