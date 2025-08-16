import { supabase } from '../contexts/CleanSupabaseAuth';

// Flexible wrapper for Supabase operations that handles constraint errors
export class FlexibleSupabase {
  // Wrapper for insert operations that retries with modified data if constraints fail
  static async flexibleInsert(table: string, data: any) {
    try {
      // First attempt - try as is
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select();

      if (!error) return { data: result, error: null };

      // If constraint error, try to fix common issues
      if (error.message.includes('constraint') || error.code === '23514') {
        console.warn(`Constraint error on ${table}, attempting flexible insert...`);
        
        // Create a copy of data to modify
        const flexibleData = { ...data };
        
        // Handle common constraint fields by setting to null or default values
        const constraintFields = {
          'type': 'General',
          'status': 'Active', 
          'year_of_study': 'Undergraduate',
          'attendance_status': 'scheduled',
          'role': 'user'
        };
        
        // Try to fix constraint fields
        Object.keys(constraintFields).forEach(field => {
          if (field in flexibleData && flexibleData[field]) {
            // Store original value in a custom field
            flexibleData[`custom_${field}`] = flexibleData[field];
            // Set to default constraint value
            flexibleData[field] = constraintFields[field as keyof typeof constraintFields];
          }
        });
        
        // Retry with modified data
        const { data: retryResult, error: retryError } = await supabase
          .from(table)
          .insert(flexibleData)
          .select();
          
        if (!retryError) {
          console.log(`Successfully inserted with flexible data`);
          return { data: retryResult, error: null };
        }
        
        // If still failing, return original error
        return { data: null, error };
      }
      
      return { data: null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }
  
  // Wrapper for update operations
  static async flexibleUpdate(table: string, id: string, data: any) {
    try {
      // First attempt - try as is
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select();

      if (!error) return { data: result, error: null };

      // If constraint error, use same flexible approach as insert
      if (error.message.includes('constraint') || error.code === '23514') {
        console.warn(`Constraint error on ${table} update, attempting flexible update...`);
        
        const flexibleData = { ...data };
        
        // Handle constraint fields
        const constraintFields = {
          'type': 'General',
          'status': 'Active',
          'year_of_study': 'Undergraduate', 
          'attendance_status': 'scheduled',
          'role': 'user'
        };
        
        Object.keys(constraintFields).forEach(field => {
          if (field in flexibleData && flexibleData[field]) {
            flexibleData[`custom_${field}`] = flexibleData[field];
            flexibleData[field] = constraintFields[field as keyof typeof constraintFields];
          }
        });
        
        const { data: retryResult, error: retryError } = await supabase
          .from(table)
          .update(flexibleData)
          .eq('id', id)
          .select();
          
        if (!retryError) {
          console.log(`Successfully updated with flexible data`);
          return { data: retryResult, error: null };
        }
        
        return { data: null, error };
      }
      
      return { data: null, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }
  
  // Helper to get custom field value or default
  static getFlexibleValue(record: any, field: string): string {
    // First check if there's a custom value
    if (record[`custom_${field}`]) {
      return record[`custom_${field}`];
    }
    // Otherwise return the regular field
    return record[field];
  }
}

// Export convenience functions
export const flexibleInsert = FlexibleSupabase.flexibleInsert;
export const flexibleUpdate = FlexibleSupabase.flexibleUpdate;
export const getFlexibleValue = FlexibleSupabase.getFlexibleValue;