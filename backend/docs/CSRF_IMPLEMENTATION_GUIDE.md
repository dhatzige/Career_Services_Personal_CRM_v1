# CSRF Protection Implementation Guide

## Overview

This guide shows how to properly implement CSRF protection using the `csrf-csrf` package in your application.

## Key Components

The `csrf-csrf` package provides the following utilities:

1. **`generateCsrfToken`** - Generates a new CSRF token
2. **`doubleCsrfProtection`** - Middleware that validates CSRF tokens
3. **`validateRequest`** - Manual validation function
4. **`invalidCsrfTokenError`** - Error object for invalid tokens

## Implementation

### 1. Setup CSRF Protection (security.ts)

```typescript
import { doubleCsrf } from 'csrf-csrf';

// Initialize CSRF protection
const { 
  invalidCsrfTokenError, 
  generateCsrfToken, 
  validateRequest, 
  doubleCsrfProtection 
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'your-secret-key',
  cookieName: 'psifi.x-csrf-token',
  cookieOptions: {
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  },
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'] as string,
  getSessionIdentifier: (req) => req.sessionID || req.ip || 'anonymous',
});

// Export with renamed function for consistency
export { 
  generateCsrfToken as generateCSRFToken, 
  doubleCsrfProtection, 
  invalidCsrfTokenError, 
  validateRequest 
};
```

### 2. Generate CSRF Tokens

In your controllers, generate tokens for the frontend:

```typescript
import { generateCSRFToken } from '../middleware/security';

export const getStatus = async (req: Request, res: Response) => {
  // Generate a new CSRF token
  const csrfToken = generateCSRFToken(req, res);
  
  res.json({
    success: true,
    csrfToken // Send to frontend
  });
};
```

### 3. Apply CSRF Protection Middleware

Apply the middleware to routes that modify state:

```typescript
import { doubleCsrfProtection } from './middleware/security';

// Apply to specific routes
app.use('/api/students', doubleCsrfProtection, studentRoutes);
app.use('/api/notes', doubleCsrfProtection, noteRoutes);

// Or apply to specific endpoints
router.post('/create', doubleCsrfProtection, createHandler);
router.put('/update/:id', doubleCsrfProtection, updateHandler);
router.delete('/delete/:id', doubleCsrfProtection, deleteHandler);
```

### 4. Frontend Implementation

Send the CSRF token with requests:

```javascript
// Get CSRF token from API
const response = await fetch('/api/auth/status');
const { csrfToken } = await response.json();

// Include in subsequent requests
const createResponse = await fetch('/api/students', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken // Send in header
  },
  body: JSON.stringify(data)
});
```

## Configuration Options

### Cookie Options
- `sameSite`: 'strict' | 'lax' | 'none' (prevents CSRF attacks)
- `secure`: true in production (HTTPS only)
- `httpOnly`: true (prevents XSS access)

### Request Configuration
- `ignoredMethods`: Methods that don't need CSRF protection
- `getCsrfTokenFromRequest`: Function to extract token from request
- `getSessionIdentifier`: Function to identify the session

## Error Handling

The middleware automatically handles invalid tokens:

```typescript
// Custom error handling
app.use((err, req, res, next) => {
  if (err === invalidCsrfTokenError) {
    res.status(403).json({
      success: false,
      message: 'Invalid CSRF token'
    });
  } else {
    next(err);
  }
});
```

## Security Best Practices

1. **Use Environment Variables**: Store CSRF secret in environment variables
2. **Rotate Secrets**: Regularly rotate your CSRF secret
3. **Session Binding**: Bind tokens to user sessions when possible
4. **HTTPS Only**: Use secure cookies in production
5. **Token Lifetime**: Consider implementing token expiration

## Troubleshooting

### Common Issues

1. **TypeScript Error: 'generateToken' does not exist**
   - Use `generateCsrfToken` instead of `generateToken`

2. **Token Validation Fails**
   - Ensure token is sent in the correct header
   - Check cookie settings match your environment
   - Verify session identifier is consistent

3. **Cookies Not Set**
   - Check `sameSite` and `secure` settings
   - Ensure CORS is properly configured
   - Verify cookie domain settings

## Complete Example

```typescript
// Backend endpoint
export const createStudent = async (req: Request, res: Response) => {
  // CSRF protection is applied via middleware
  // If we reach here, the token is valid
  
  try {
    const student = await StudentModel.create(req.body);
    
    // Generate new token for next request
    const csrfToken = generateCSRFToken(req, res);
    
    res.json({
      success: true,
      data: student,
      csrfToken
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```