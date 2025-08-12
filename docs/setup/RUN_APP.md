# Career Services CRM - Quick Start Guide

## ✅ Current Status
- Backend: Running on http://localhost:4001
- Frontend: Running on http://localhost:5173
- Database: SQLite (no Docker needed)
- Authentication: JWT (no Clerk needed)

## 🚀 How to Access the App

### Step 1: Clear Any Cached Service Workers
If you're experiencing loading issues:
1. Open `clear-sw.html` in your browser
2. Click "Clear Everything" button
3. Close that tab

### Step 2: Access the Application
Open http://localhost:5173 in your browser

### Step 3: First Time Setup
1. Click "Get Started" to create your admin account
2. Use any email and password (it's stored locally)
3. After login, you'll see the dashboard

## 🛠️ If Something Goes Wrong

### Backend Not Running?
```bash
cd backend
npm run dev
```

### Frontend Not Running?
```bash
# In the project root
npm run dev
```

### Still Having Issues?
1. Open `test-build.html` to run diagnostics
2. Check that both servers are running on correct ports:
   - Backend: 4001 (not 3001 to avoid conflicts)
   - Frontend: 5173

## 📱 Key Features
- **Student Management**: Add and track students
- **Notes System**: Replaces Google Sheets with built-in notes
- **Calendly Integration**: Schedule meetings (Settings > Integrations)
- **Document Storage**: Upload resumes and documents
- **Career Tracking**: Track applications, interviews, workshops

## 🔐 API Keys
Your Claude API key is already configured in both `.env` files.

## 📊 Test Pages
- `test.html` - Simple API connectivity test
- `clear-sw.html` - Service worker cleanup tool
- `test-build.html` - Comprehensive diagnostics

Remember: This runs completely locally with SQLite, no Docker or external services needed!