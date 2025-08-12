# Sentry Troubleshooting Guide

## Issue: Sentry Not Receiving Errors

### 1. Restart Your Development Server
Environment variables are loaded when the server starts. After adding the DSN:

```bash
# Stop the server (Ctrl+C)
# Start it again
npm run dev
```

### 2. Check Browser Console
When your app loads, you should see:
```
Sentry initialization: {dsn: "DSN is set", environment: "development", fullDsn: "https://..."}
✅ Sentry initialized successfully
```

### 3. Verify in Settings → Data Management
The Sentry Debug component shows:
- DSN Status: ✅ Configured
- Sentry Initialized: ✅ Yes

### 4. Common Issues

#### Issue: DSN not loading
**Solution**: Make sure `.env.local` file is in the root directory (not in `src/`)

#### Issue: Blocked by Ad Blockers
**Solution**: Some ad blockers block Sentry. Try:
- Disable ad blockers temporarily
- Test in incognito mode
- Check browser network tab for blocked requests

#### Issue: CORS or CSP blocking
**Solution**: Check browser console for errors like:
- "Refused to connect to 'https://...sentry.io'"
- "Content Security Policy" errors

### 5. Test Sentry Manually
Open browser console and run:
```javascript
// Check if Sentry is loaded
console.log('Sentry available:', typeof window.Sentry !== 'undefined');

// Check if initialized
console.log('Sentry client:', window.Sentry?.getClient());

// Send test error
window.Sentry?.captureException(new Error('Manual test error'));

// Send test message
window.Sentry?.captureMessage('Test message', 'info');
```

### 6. Network Test
In browser DevTools → Network tab:
1. Clear the network log
2. Trigger an error
3. Look for requests to `sentry.io`
4. Check if they're successful (200 status)

### 7. Alternative Test
Create a simple test file `test-sentry-direct.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Direct Sentry Test</title>
    <script src="https://browser.sentry-cdn.com/8.45.0/bundle.min.js"></script>
</head>
<body>
    <h1>Direct Sentry Test</h1>
    <button onclick="testError()">Test Error</button>
    
    <script>
        Sentry.init({
            dsn: "https://8f20adcf8e32893848f696a898fd4038@o4509767534379008.ingest.de.sentry.io/4509767544340560",
            debug: true
        });
        
        function testError() {
            Sentry.captureException(new Error('Direct test error'));
            alert('Error sent! Check Sentry dashboard.');
        }
    </script>
</body>
</html>
```

### 8. Backend Test
Test if backend Sentry is working:
```bash
# Make sure backend is running
cd backend && npm run dev

# In another terminal
curl http://localhost:4001/api/test/error
```

Check backend logs for:
```
✅ Sentry monitoring initialized
```

### If Nothing Works

1. **Double-check the DSN**:
   - Frontend: `VITE_SENTRY_DSN` in `.env.local`
   - Backend: `SENTRY_DSN` in `backend/.env`

2. **Check Sentry Project Settings**:
   - Go to your Sentry project settings
   - Verify the DSN matches
   - Check if project is active

3. **Try the Wizard**:
   ```bash
   npx @sentry/wizard@latest -i sentry
   ```

4. **Enable Debug Mode**:
   Add to Sentry.init():
   ```javascript
   debug: true,
   ```