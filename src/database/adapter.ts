import * as Sentry from '@sentry/node';
import { supabase } from '../config/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Simplified Database Adapter
 * 
 * Since we're using SQLite directly in models via database/connection.ts,
 * this adapter is now only responsible for:
 * 1. Providing Supabase auth functionality
 * 2. Health checks
 * 3. Future flexibility if we need to switch back
 */
class DatabaseAdapter {
  private supabaseClient: SupabaseClient;

  constructor() {
    this.supabaseClient = supabase;
    
    console.log('Database adapter initialized - Using SQLite for data storage, Supabase for auth');
    
    // Log to Sentry
    Sentry.setContext('database', {
      mode: 'hybrid',
      data: 'sqlite',
      auth: 'supabase',
      environment: process.env.NODE_ENV || 'development'
    });
  }

  // Authentication remains with Supabase
  get auth() {
    return this.supabaseClient.auth;
  }

  // Simple health check - just verify auth is working
  async isHealthy(): Promise<boolean> {
    try {
      // Check if we can get the current session
      const { data: { session }, error } = await this.supabaseClient.auth.getSession();
      return !error;
    } catch (error) {
      Sentry.captureException(error, {
        tags: {
          component: 'database_adapter',
          operation: 'health_check'
        }
      });
      return false;
    }
  }
}

// Create and export singleton instance
const databaseAdapter = new DatabaseAdapter();

export default databaseAdapter;
export { databaseAdapter, DatabaseAdapter };