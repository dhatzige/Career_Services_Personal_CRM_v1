import { supabase, checkDatabaseHealth as checkSupabaseHealth } from './supabase';
import sqliteDb from './connection';
import logger from '../utils/logger';

// Determine which database to use based on environment
// USE_LOCAL_DB=true means use SQLite for data (but keep Supabase for auth)
const useLocalDb = process.env.USE_LOCAL_DB === 'true';
const useSupabase = !useLocalDb && (process.env.USE_SUPABASE === 'true' || process.env.NODE_ENV === 'production');

export interface QueryResult {
  rows: any[];
  rowCount: number;
}

class DatabaseAdapter {
  private useSupabase: boolean;
  private useLocalDb: boolean;

  constructor() {
    this.useLocalDb = useLocalDb;
    this.useSupabase = useSupabase && !!supabase;
    
    if (this.useLocalDb) {
      logger.info('Using SQLite database for data storage (Supabase for auth only)');
    } else if (this.useSupabase) {
      logger.info('Using Supabase database');
    } else {
      logger.info('Using SQLite database (fallback)');
    }
  }

  async initialize(): Promise<void> {
    if (this.useLocalDb || !this.useSupabase) {
      // SQLite is already initialized by connection.ts
      await sqliteDb.initialize();
      logger.info('SQLite database ready');
    } else {
      // Check Supabase connection
      const isHealthy = await checkSupabaseHealth();
      if (!isHealthy) {
        throw new Error('Failed to connect to Supabase');
      }
      logger.info('Supabase database ready');
    }
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    if (this.useLocalDb || !this.useSupabase) {
      // Use the existing SQLite wrapper
      return sqliteDb.query(sql, params);
    } else {
      // Convert SQL to Supabase query
      // This is a simplified implementation - in production, you'd want a proper SQL parser
      throw new Error('Direct SQL queries not supported with Supabase. Use models instead.');
    }
  }

  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (this.useLocalDb || !this.useSupabase) {
      // Use the existing SQLite transaction method
      return sqliteDb.transaction(callback);
    } else {
      // Supabase doesn't have client-side transactions
      // Just execute the callback with this as the client
      return callback(this);
    }
  }

  isHealthy(): boolean {
    if (this.useLocalDb || !this.useSupabase) {
      return sqliteDb.isHealthy();
    } else {
      // For Supabase, we'd need an async check
      return !!supabase;
    }
  }

  getStats() {
    if (this.useLocalDb || !this.useSupabase) {
      return sqliteDb.getStats();
    } else {
      return {
        totalCount: 1,
        idleCount: 0,
        waitingCount: 0
      };
    }
  }

  async close(): Promise<void> {
    if (this.useLocalDb || !this.useSupabase) {
      await sqliteDb.close();
    }
    // Supabase client doesn't need explicit closing
  }
}

// Create singleton instance
const database = new DatabaseAdapter();

// Re-export SQLite specific functions for backward compatibility
export { generateId } from './connection';
export default database;