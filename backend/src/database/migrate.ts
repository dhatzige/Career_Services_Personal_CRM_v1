import { readFileSync } from 'fs';
import { join } from 'path';
import database from './connection';

/**
 * Run database migrations
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...');
    
    // Initialize database connection and schema
    database.initialize();
    console.log('✅ Database connection established');
    
    console.log('✅ Database schema initialized successfully');
    
    // Verify tables were created (SQLite specific)
    const tables = await database.query(`
      SELECT name as tablename 
      FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `);
    
    console.log('📊 Created tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.tablename}`);
    });
    
    console.log('🎉 Database migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await database.close();
  }
}

/**
 * Check if database is properly configured
 */
async function checkDatabaseStatus() {
  try {
    await database.initialize();
    
    // Check if tables exist
    const tables = await database.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const requiredTables = [
      'users',
      'students', 
      'notes',
      'consultations',
      'follow_up_reminders',
      'activity_logs'
    ];
    
    const existingTables = tables.rows.map(row => row.tablename);
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Missing tables:', missingTables);
      return false;
    }
    
    console.log('✅ All required tables exist');
    return true;
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    return false;
  } finally {
    await database.close();
  }
}

/**
 * Create database indexes for better performance
 */
async function createIndexes() {
  try {
    console.log('🔍 Creating database indexes...');
    
    const indexes = [
      // Students table indexes
      `CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);`,
      `CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);`,
      `CREATE INDEX IF NOT EXISTS idx_students_program ON students(program_type);`,
      `CREATE INDEX IF NOT EXISTS idx_students_year ON students(year_of_study);`,
      `CREATE INDEX IF NOT EXISTS idx_students_last_interaction ON students(last_interaction);`,
      
      // Notes table indexes
      `CREATE INDEX IF NOT EXISTS idx_notes_student_id ON notes(student_id);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_created ON notes(created_at);`,
      `CREATE INDEX IF NOT EXISTS idx_notes_private ON notes(is_private);`,
      
      // Consultations table indexes
      `CREATE INDEX IF NOT EXISTS idx_consultations_student_id ON consultations(student_id);`,
      `CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);`,
      `CREATE INDEX IF NOT EXISTS idx_consultations_type ON consultations(type);`,
      `CREATE INDEX IF NOT EXISTS idx_consultations_attended ON consultations(attended);`,
      `CREATE INDEX IF NOT EXISTS idx_consultations_follow_up ON consultations(follow_up_required);`,
      
      // Follow-up reminders table indexes
      `CREATE INDEX IF NOT EXISTS idx_follow_up_student_id ON follow_up_reminders(student_id);`,
      `CREATE INDEX IF NOT EXISTS idx_follow_up_date ON follow_up_reminders(reminder_date);`,
      `CREATE INDEX IF NOT EXISTS idx_follow_up_priority ON follow_up_reminders(priority);`,
      `CREATE INDEX IF NOT EXISTS idx_follow_up_completed ON follow_up_reminders(completed);`,
      
      // Activity logs table indexes
      `CREATE INDEX IF NOT EXISTS idx_activity_student_id ON activity_logs(student_id);`,
      `CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(activity_type);`,
      `CREATE INDEX IF NOT EXISTS idx_activity_timestamp ON activity_logs(timestamp);`,
      
      // Users table indexes
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
      `CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);`
    ];
    
    for (const indexSql of indexes) {
      await database.query(indexSql);
    }
    
    console.log('✅ Database indexes created successfully');
    
  } catch (error) {
    console.error('❌ Index creation failed:', error);
    throw error;
  }
}

/**
 * Drop all tables (for development/testing)
 */
async function dropTables() {
  try {
    console.log('🗑️  Dropping all tables...');
    
    const dropQueries = [
      'DROP TABLE IF EXISTS activity_logs CASCADE;',
      'DROP TABLE IF EXISTS follow_up_reminders CASCADE;',
      'DROP TABLE IF EXISTS consultations CASCADE;',
      'DROP TABLE IF EXISTS notes CASCADE;',
      'DROP TABLE IF EXISTS students CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;'
    ];
    
    for (const query of dropQueries) {
      await database.query(query);
    }
    
    console.log('✅ All tables dropped successfully');
    
  } catch (error) {
    console.error('❌ Drop tables failed:', error);
    throw error;
  }
}

/**
 * Reset database (drop and recreate)
 */
async function resetDatabase() {
  try {
    console.log('🔄 Resetting database...');
    
    await database.initialize();
    await dropTables();
    await runMigrations();
    
    console.log('✅ Database reset completed');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Command line interface
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'migrate':
      await runMigrations();
      break;
      
    case 'check':
      const isHealthy = await checkDatabaseStatus();
      process.exit(isHealthy ? 0 : 1);
      
    case 'index':
      await database.initialize();
      await createIndexes();
      await database.close();
      break;
      
    case 'drop':
      await database.initialize();
      await dropTables();
      await database.close();
      break;
      
    case 'reset':
      await resetDatabase();
      break;
      
    default:
      console.log('Usage: npm run db:migrate [migrate|check|index|drop|reset]');
      console.log('');
      console.log('Commands:');
      console.log('  migrate - Run database migrations');
      console.log('  check   - Check database status');
      console.log('  index   - Create database indexes');
      console.log('  drop    - Drop all tables');
      console.log('  reset   - Drop and recreate database');
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Migration script error:', error);
    process.exit(1);
  });
}

export { runMigrations, checkDatabaseStatus, createIndexes, dropTables, resetDatabase }; 