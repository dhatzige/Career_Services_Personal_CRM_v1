import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is not set in environment variables');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('Neither SUPABASE_SERVICE_KEY nor SUPABASE_ANON_KEY is set in environment variables');
}

// Create client with service key for backend operations
export const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Export individual keys for specific uses
export { supabaseUrl, supabaseServiceKey, supabaseAnonKey };