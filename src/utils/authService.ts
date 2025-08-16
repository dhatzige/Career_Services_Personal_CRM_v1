export interface AuthConfig {
  isConfigured: boolean;
  salt: string;
  passwordHash: string;
  iterations: number;
}

export interface SessionData {
  username: string;
  sessionToken: string;
  loginTime: number;
  lastActivity: number;
  stayLoggedIn: boolean;
}

const AUTH_CONFIG_KEY = 'auth_config';
const SESSION_KEY = 'auth_session';
const FAILED_ATTEMPTS_KEY = 'failed_attempts';
const LOCKOUT_KEY = 'account_lockout';

const PBKDF2_ITERATIONS = 100000;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 seconds

class AuthService {
  private sessionCheckInterval: NodeJS.Timeout | null = null;

  // Generate cryptographically secure random salt
  private generateSalt(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Generate secure session token
  private generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash password using PBKDF2
  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const hashArray = Array.from(new Uint8Array(derivedBits));
    return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Check if authentication is configured
  isConfigured(): boolean {
    const config = localStorage.getItem(AUTH_CONFIG_KEY);
    return config !== null;
  }

  // Get authentication configuration
  private getAuthConfig(): AuthConfig | null {
    const config = localStorage.getItem(AUTH_CONFIG_KEY);
    if (!config) return null;
    
    try {
      return JSON.parse(config);
    } catch {
      return null;
    }
  }

  // Set up initial authentication
  async setupAuth(password: string): Promise<boolean> {
    if (this.isConfigured()) {
      throw new Error('Authentication is already configured');
    }

    if (!this.validatePasswordStrength(password)) {
      throw new Error('Password does not meet security requirements');
    }

    try {
      const salt = this.generateSalt();
      const passwordHash = await this.hashPassword(password, salt);

      const config: AuthConfig = {
        isConfigured: true,
        salt,
        passwordHash,
        iterations: PBKDF2_ITERATIONS
      };

      localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(config));
      return true;
    } catch (error) {
      console.error('Failed to setup authentication:', error);
      return false;
    }
  }

  // Validate password strength
  validatePasswordStrength(password: string): { isValid: boolean; score: number; feedback: string[] } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Password must be at least 8 characters long');

    if (password.length >= 12) score += 1;
    else feedback.push('Consider using 12+ characters for better security');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    if (!/(.)\1{2,}/.test(password)) score += 1;
    else feedback.push('Avoid repeating characters');

    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (!commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score += 1;
    } else {
      feedback.push('Avoid common passwords');
    }

    return {
      isValid: score >= 5,
      score: Math.min(score, 5),
      feedback
    };
  }

  // Check if account is locked
  isAccountLocked(): { locked: boolean; timeRemaining?: number } {
    const lockoutData = localStorage.getItem(LOCKOUT_KEY);
    if (!lockoutData) return { locked: false };

    try {
      const { lockedUntil } = JSON.parse(lockoutData);
      const now = Date.now();
      
      if (now < lockedUntil) {
        return {
          locked: true,
          timeRemaining: lockedUntil - now
        };
      } else {
        localStorage.removeItem(LOCKOUT_KEY);
        localStorage.removeItem(FAILED_ATTEMPTS_KEY);
        return { locked: false };
      }
    } catch {
      return { locked: false };
    }
  }

  // Record failed login attempt
  private recordFailedAttempt(): void {
    const attempts = parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0') + 1;
    localStorage.setItem(FAILED_ATTEMPTS_KEY, attempts.toString());

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutData = {
        lockedUntil: Date.now() + LOCKOUT_DURATION
      };
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify(lockoutData));
    }
  }

  // Clear failed attempts
  private clearFailedAttempts(): void {
    localStorage.removeItem(FAILED_ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
  }

  // Authenticate user
  async authenticate(password: string, stayLoggedIn: boolean = false): Promise<boolean> {
    const lockStatus = this.isAccountLocked();
    if (lockStatus.locked) {
      throw new Error('Account is temporarily locked. Please try again later.');
    }

    const config = this.getAuthConfig();
    if (!config) {
      throw new Error('Authentication not configured');
    }

    try {
      const passwordHash = await this.hashPassword(password, config.salt);
      
      if (passwordHash === config.passwordHash) {
        this.clearFailedAttempts();
        this.createSession('user', stayLoggedIn);
        return true;
      } else {
        this.recordFailedAttempt();
        return false;
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Create session
  private createSession(username: string, stayLoggedIn: boolean): void {
    const sessionData: SessionData = {
      username,
      sessionToken: this.generateSessionToken(),
      loginTime: Date.now(),
      lastActivity: Date.now(),
      stayLoggedIn
    };

    const storageKey = stayLoggedIn ? 'localStorage' : 'sessionStorage';
    const storage = storageKey === 'localStorage' ? localStorage : sessionStorage;
    
    storage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    
    // Start session monitoring
    this.startSessionMonitoring();
  }

  // Get current session
  getSession(): SessionData | null {
    // Check both localStorage and sessionStorage
    let sessionData = localStorage.getItem(SESSION_KEY);
    let fromLocalStorage = true;
    
    if (!sessionData) {
      sessionData = sessionStorage.getItem(SESSION_KEY);
      fromLocalStorage = false;
    }

    if (!sessionData) return null;

    try {
      const session: SessionData = JSON.parse(sessionData);
      const now = Date.now();
      
      // Check if session has expired
      if (!session.stayLoggedIn && (now - session.lastActivity > SESSION_TIMEOUT)) {
        this.clearSession();
        return null;
      }

      // Update last activity
      session.lastActivity = now;
      const storage = fromLocalStorage ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(session));

      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  // Update session activity
  updateActivity(): void {
    const session = this.getSession();
    if (session) {
      session.lastActivity = Date.now();
      const storage = session.stayLoggedIn ? localStorage : sessionStorage;
      storage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  }

  // Clear session
  clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
      this.sessionCheckInterval = null;
    }
  }

  // Start session monitoring
  private startSessionMonitoring(): void {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(() => {
      const session = this.getSession();
      if (!session) {
        // Session expired, trigger logout
        window.dispatchEvent(new CustomEvent('sessionExpired'));
      }
    }, 60000); // Check every minute
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    const config = this.getAuthConfig();
    if (!config) return false;

    // Verify current password
    const currentHash = await this.hashPassword(currentPassword, config.salt);
    if (currentHash !== config.passwordHash) {
      return false;
    }

    // Validate new password
    if (!this.validatePasswordStrength(newPassword).isValid) {
      throw new Error('New password does not meet security requirements');
    }

    // Generate new salt and hash
    const newSalt = this.generateSalt();
    const newHash = await this.hashPassword(newPassword, newSalt);

    // Update configuration
    const newConfig: AuthConfig = {
      ...config,
      salt: newSalt,
      passwordHash: newHash
    };

    localStorage.setItem(AUTH_CONFIG_KEY, JSON.stringify(newConfig));
    return true;
  }

  // Reset authentication (for development/testing)
  resetAuth(): void {
    localStorage.removeItem(AUTH_CONFIG_KEY);
    this.clearSession();
    this.clearFailedAttempts();
  }

  // Get failed attempts count
  getFailedAttempts(): number {
    return parseInt(localStorage.getItem(FAILED_ATTEMPTS_KEY) || '0');
  }
}

export const authService = new AuthService();