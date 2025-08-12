# Troubleshooting Guide

## Service Worker Issues (Network Errors)

If you see errors like:
- "The FetchEvent for ... resulted in a network error response"
- "Failed to convert value to 'Response'"

### Solution:

1. **Clear Service Worker in Chrome/Edge:**
   - Open Developer Tools (F12)
   - Go to Application tab
   - Click on "Service Workers" in the left sidebar
   - Find the service worker for localhost:5173
   - Click "Unregister"

2. **Clear Cache:**
   - In Application tab, click "Storage" in the left sidebar
   - Click "Clear site data"

3. **Hard Refresh:**
   - Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

4. **Alternative: Disable Service Worker in Development**
   If issues persist, you can temporarily disable the service worker:
   - Comment out the line in `/src/utils/offline.ts` that registers the service worker
   - Or rename `/public/sw.js` to `/public/sw.js.disabled`

## Database Issues

If the backend fails to start:

1. **Check SQLite Installation:**
   ```bash
   cd backend
   npm install better-sqlite3
   ```

2. **Permissions Issue:**
   ```bash
   cd backend
   mkdir -p data uploads
   chmod 755 data uploads
   ```

3. **Reset Database:**
   ```bash
   cd backend
   rm -f data/career_services.db
   npm run dev
   ```

## Port Already in Use

If you see "Port already in use" errors:

1. **Find and kill processes:**
   ```bash
   # Find process on port 3001 (backend)
   lsof -i :3001
   kill -9 <PID>
   
   # Find process on port 5173 (frontend)
   lsof -i :5173
   kill -9 <PID>
   ```

2. **Or use different ports:**
   - Backend: Edit `backend/.env` and change `PORT=3002`
   - Frontend: Edit `vite.config.ts` and add:
     ```js
     server: {
       port: 5174
     }
     ```

## Authentication Issues

If you can't log in:

1. **Reset Authentication:**
   - Delete the database: `rm backend/data/career_services.db`
   - Restart the backend
   - Create a new admin account

2. **Check JWT Secret:**
   - Ensure `backend/.env` has a `JWT_SECRET` value
   - If missing, run: `./setup.sh` again

## Calendly Integration Not Working

1. **Check URL Format:**
   - Must be full Calendly event URL
   - Example: `https://calendly.com/your-username/30min`

2. **Browser Blocking:**
   - Check browser console for Content Security Policy errors
   - Try disabling ad blockers
   - Check if Calendly is blocked by your organization

## Build Issues

If `npm install` fails:

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Node Version:**
   - Ensure Node.js version 16 or higher
   - Check with: `node --version`

3. **SQLite Build Errors:**
   ```bash
   # macOS
   brew install sqlite3
   
   # Ubuntu/Debian
   sudo apt-get install sqlite3 libsqlite3-dev
   ```