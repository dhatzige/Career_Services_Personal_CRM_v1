import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/CleanSupabaseAuth';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Info
} from 'lucide-react';
import api from '../services/api';

interface InvitationInfo {
  email: string;
  role: string;
  expires_at: string;
}

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [invitationToken, setInvitationToken] = useState('');
  
  // Form fields
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password validation
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);
  
  // Check invitation token on mount
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setError('No invitation token provided. Please use the link from your invitation email.');
      setLoading(false);
      return;
    }
    
    setInvitationToken(token);
    checkInvitation(token);
  }, [searchParams]);
  
  // Validate password on change
  useEffect(() => {
    const errors: string[] = [];
    
    if (password.length > 0) {
      if (password.length < 8) {
        errors.push('At least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter');
      }
      if (!/[0-9]/.test(password)) {
        errors.push('One number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('One special character');
      }
    }
    
    setPasswordErrors(errors);
  }, [password]);
  
  const checkInvitation = async (token: string) => {
    try {
      const response = await api.post('/auth/check-invitation', { token });
      
      if (response.success && response.data) {
        setInvitationInfo(response.data);
        
        // Check if invitation is expired
        const expiresAt = new Date(response.data.expires_at);
        if (expiresAt < new Date()) {
          setError('This invitation has expired. Please contact your administrator for a new invitation.');
        }
      } else {
        setError('Invalid invitation token. Please check your invitation link.');
      }
    } catch (err: any) {
      console.error('Failed to check invitation:', err);
      setError(err.response?.data?.message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password requirements
    if (passwordErrors.length > 0) {
      setError('Please meet all password requirements');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post('/auth/register', {
        token: invitationToken,
        email: invitationInfo?.email,
        password
      });
      
      if (response.success) {
        setSuccess('Registration successful! Redirecting to login...');
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login', { 
            replace: true,
            state: { 
              message: 'Registration successful! Please login with your new account.' 
            }
          });
        }, 2000);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Career Services CRM</h1>
          <p className="mt-2 text-gray-600">
            Complete your registration
          </p>
        </div>

        <div className="bg-white shadow-xl rounded-lg p-8">
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-center text-gray-900">
              Create Your Account
            </h2>
            {invitationInfo && !error && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-800 font-medium">
                      You've been invited to join as a {invitationInfo.role}
                    </p>
                    <p className="text-blue-600 mt-1">
                      Email: {invitationInfo.email}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              {error}
              {error.includes('expired') && (
                <div className="mt-2 text-sm">
                  <a 
                    href="/login" 
                    className="underline hover:text-red-800"
                  >
                    Return to login
                  </a>
                </div>
              )}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <CheckCircle className="w-4 h-4 inline mr-2" />
              {success}
            </div>
          )}

          {invitationInfo && !error && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email (from invitation)
                </label>
                <div className="mt-1 relative">
                  <input
                    id="email"
                    type="email"
                    value={invitationInfo.email}
                    disabled
                    className="appearance-none block w-full px-3 py-2 pl-10 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                
                {/* Password Requirements */}
                {password.length > 0 && (
                  <div className="mt-2 text-xs space-y-1">
                    <p className="font-medium text-gray-700">Password must contain:</p>
                    {['At least 8 characters', 'One uppercase letter', 'One lowercase letter', 'One number', 'One special character'].map((req) => (
                      <div key={req} className="flex items-center">
                        {passwordErrors.includes(req) ? (
                          <XCircle className="h-3 w-3 text-red-500 mr-1" />
                        ) : (
                          <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                        )}
                        <span className={passwordErrors.includes(req) ? 'text-red-600' : 'text-green-600'}>
                          {req}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <div className="mt-1 relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="appearance-none block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                  />
                  <Shield className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || passwordErrors.length > 0 || password !== confirmPassword || !password}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>

              <div className="text-center text-sm">
                <a 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-500"
                >
                  Back to login
                </a>
              </div>
            </form>
          )}

          {!invitationInfo && error && (
            <div className="text-center">
              <a 
                href="/login" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Return to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;