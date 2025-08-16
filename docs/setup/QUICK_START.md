# Quick Start Guide - Career Services CRM

## Starting the Application

### Option 1: Using Terminal Tabs (Recommended)

1. **Open Terminal and start the backend:**
   ```bash
   cd /Users/dimxatz/Desktop/Bolt_Projects/project/backend
   npm run dev
   ```
   Wait until you see: "🚀 Career Services CRM running on port 3001"

2. **Open a new terminal tab (Cmd+T) and start the frontend:**
   ```bash
   cd /Users/dimxatz/Desktop/Bolt_Projects/project
   npm run dev
   ```
   Wait until you see: "➜  Local:   http://localhost:5173/"

3. **Open your browser and visit:** http://localhost:5173

### Option 2: Using the start script

```bash
cd /Users/dimxatz/Desktop/Bolt_Projects/project
./start.sh
```

## First Time Setup

1. **Create Admin Account**
   - When you first visit http://localhost:5173, you'll be prompted to create an admin account
   - Choose a secure password

2. **Configure Calendly**
   - After logging in, go to Settings (gear icon)
   - Click on the "Calendly" tab
   - Enter your Calendly event URL (e.g., https://calendly.com/yourname/30min)
   - Save settings

3. **Start Using**
   - Add your first student by clicking "Add Student"
   - Take notes during meetings
   - Schedule appointments through Calendly integration
   - Track job applications and career progress

## Troubleshooting

### If the backend won't start:
1. Make sure you're in the backend directory
2. Check if port 3001 is already in use: `lsof -i :3001`
3. Install dependencies: `npm install`

### If the frontend won't start:
1. Make sure you're in the project root directory
2. Check if port 5173 is already in use: `lsof -i :5173`
3. Clear the service worker (see TROUBLESHOOTING.md)

### Database Issues:
- The database is stored in `backend/data/career_services.db`
- To reset, delete this file and restart the backend

## Key Features

- **Student Management**: Track all student information including career interests
- **Note Taking**: Comprehensive notes with templates for career planning
- **Calendly Integration**: Schedule meetings directly from student profiles
- **Job Tracking**: Monitor applications, interviews, and offers
- **Analytics**: Dashboard with insights on student progress

## Daily Workflow

1. **Before meetings**: Review student profile and previous notes
2. **During meetings**: Take notes using templates
3. **After meetings**: Update job search status, schedule follow-ups
4. **Weekly**: Review dashboard for trends and students needing attention