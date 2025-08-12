import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Secure configuration management
 * Validates and provides access to environment variables
 * WITHOUT exposing them in logs
 */
class SecureConfig {
  private config: Record<string, string | undefined> = {};
  private sensitiveKeys = new Set([
    'CLAUDE_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_ANON_KEY',
    'CALENDLY_API_KEY',
    'RESEND_API_KEY',
    'SESSION_SECRET',
    'CSRF_SECRET',
    'JWT_SECRET',
    'SENTRY_DSN',
    'UPSTASH_REDIS_REST_TOKEN'
  ]);

  constructor() {
    this.loadConfig();
    this.validateConfig();
  }

  private loadConfig() {
    // Load all environment variables
    this.config = { ...process.env };
  }

  private validateConfig() {
    const requiredVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'SESSION_SECRET',
      'CSRF_SECRET'
    ];

    const missing = requiredVars.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing required environment variables:', missing.join(', '));
      console.error('Please check your .env file');
      
      // In production, exit if critical vars are missing
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }

    // Validate secrets are not default values in production
    if (process.env.NODE_ENV === 'production') {
      const defaultSecrets = [
        'SESSION_SECRET',
        'CSRF_SECRET',
        'JWT_SECRET'
      ];

      for (const key of defaultSecrets) {
        if (this.config[key]?.includes('change-in-production') || 
            this.config[key]?.includes('your-')) {
          console.error(`❌ SECURITY ERROR: ${key} contains default value in production!`);
          process.exit(1);
        }
      }
    }
  }

  /**
   * Get configuration value safely
   * Never logs sensitive values
   */
  get(key: string): string | undefined {
    return this.config[key];
  }

  /**
   * Check if a configuration key exists
   */
  has(key: string): boolean {
    return !!this.config[key];
  }

  /**
   * Get boolean configuration value
   */
  getBoolean(key: string, defaultValue = false): boolean {
    const value = this.config[key];
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Get numeric configuration value
   */
  getNumber(key: string, defaultValue = 0): number {
    const value = this.config[key];
    if (!value) return defaultValue;
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Log configuration status WITHOUT exposing sensitive values
   */
  logStatus() {
    console.log('🔐 Configuration Status:');
    console.log('  Environment:', this.config.NODE_ENV || 'development');
    console.log('  Port:', this.config.PORT || '4001');
    
    // Log sensitive keys status without values
    for (const key of this.sensitiveKeys) {
      if (this.config[key]) {
        console.log(`  ✅ ${key}: Configured`);
      } else {
        console.log(`  ❌ ${key}: Not configured`);
      }
    }
  }

  /**
   * Mask sensitive value for safe display
   */
  getMasked(key: string): string {
    const value = this.config[key];
    if (!value) return 'NOT SET';
    
    if (this.sensitiveKeys.has(key)) {
      // Show only first 4 and last 4 characters
      if (value.length > 10) {
        return `${value.substring(0, 4)}...${value.substring(value.length - 4)}`;
      }
      return '***HIDDEN***';
    }
    
    return value;
  }
}

// Export singleton instance
export const secureConfig = new SecureConfig();

// Export helper functions
export const getConfig = (key: string) => secureConfig.get(key);
export const hasConfig = (key: string) => secureConfig.has(key);
export const getBooleanConfig = (key: string, defaultValue = false) => 
  secureConfig.getBoolean(key, defaultValue);
export const getNumberConfig = (key: string, defaultValue = 0) => 
  secureConfig.getNumber(key, defaultValue);