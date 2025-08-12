# Career Services CRM

A comprehensive web application designed specifically for university career services offices to manage student relationships, track career progress, and streamline counseling operations.

## 🎯 Purpose

This CRM replaces manual tracking methods (like Google Sheets) with a purpose-built solution that:
- Centralizes student career information and interaction history
- Provides comprehensive note-taking and documentation
- Integrates with Calendly for seamless appointment scheduling
- Tracks job applications, mock interviews, and career workshops
- Generates insights and reports for better student support

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd project
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Configure environment**
   ```bash
   # Backend configuration
   cp backend/.env.example backend/.env
   # Edit backend/.env with your settings

   # Frontend configuration  
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

### Running the Application

1. **Start the Backend** (Port 4001)
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the Frontend** (Port 5173)
   ```bash
   # In project root
   npm run dev:frontend
   ```

3. **Access the Application**
   - Open http://localhost:5173 in your browser
   - Create your admin account on first visit
   - Configure integrations in Settings

## 🏗️ Current Architecture

### Hybrid Database Approach (NEW!)
- **SQLite**: All application data (students, notes, consultations)
- **Supabase**: Authentication only (secure user management)
- **Benefits**: No constraint errors, rapid development, flexible schema

### Technology Stack
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express + TypeScript + SQLite
- **Authentication**: Supabase Auth
- **Error Tracking**: Sentry (both frontend and backend)
- **Calendar Integration**: Calendly API

## 📁 Documentation

All documentation is organized in the `/docs` folder:

- **[Documentation Index](docs/INDEX.md)** - Start here!
- **[Current Setup](docs/current/HYBRID_DATABASE_IMPLEMENTATION.md)** - Latest database configuration
- **[Developer Profile](docs/current/DEVELOPER_PROFILE.md)** - Project context and approach
- **[Setup Guides](docs/setup/)** - Various setup instructions

## 🔑 Key Features

### Student Management
- Complete student profiles with career-specific fields
- Track job search status, target industries, and locations
- Manage resume versions and career documents
- View comprehensive interaction history

### Advanced Note-Taking System
- Multiple note types (General, Career Planning, Interview Prep, etc.)
- Quick note feature for rapid entry
- Templates for common scenarios
- Search and filter capabilities

### Consultation Tracking
- Schedule and track career counseling sessions
- Automatic attendance tracking with no-show alerts
- Integration with Calendly for scheduling
- Session notes and outcomes
- Today's schedule view with quick actions
- Cancellation tracking with reasons

### Analytics & Reports
- Student engagement metrics
- Career outcomes tracking
- Daily consultation summaries
- Weekly performance reports
- CSV data exports
- Email report distribution
- No-show pattern detection

## 🔧 Environment Variables

### Backend (`/backend/.env`)
```env
# Database
USE_LOCAL_DB=true  # Use SQLite for data storage

# Supabase (Auth only)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Monitoring
SENTRY_DSN=your-backend-sentry-dsn

# Optional Services
CALENDLY_API_KEY=your-calendly-key
CLAUDE_API_KEY=your-claude-key
```

### Frontend (`.env.local`)
```env
# API
VITE_API_URL=http://localhost:4001

# Supabase (Auth)
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Monitoring
VITE_SENTRY_DSN=your-frontend-sentry-dsn
```

## 🚨 Error Monitoring

The application uses Sentry for comprehensive error tracking:
- Frontend errors captured with React Error Boundaries
- Backend errors logged with full context
- Separate environments for development/production

## 🔒 Security Features

- Secure authentication via Supabase
- Session management with JWT tokens
- CSRF protection on all endpoints
- Input sanitization and validation
- Rate limiting on API endpoints

## 📈 Project Timeline

### July 2025
- Project inception and initial development
- Basic CRM functionality implemented
- Encountered database constraint issues with Supabase

### August 1, 2025 - Major Updates
1. **Hybrid Database Implementation** - SQLite for data, Supabase for auth
2. **Sentry Integration** - Comprehensive error tracking
3. **Enhanced Error Handling** - Structured API errors and React boundaries
4. **Documentation Reorganization** - Cleaner structure in `/docs`
5. **Today's Schedule View** - Daily workflow with quick attendance marking (v0.5.0)
6. **No-Show Tracking** - Automatic counters and pattern detection (v0.6.0)
7. **Consultation Reports** - Daily/weekly summaries with exports (v0.7.0)

### Current Status
- Version 0.7.0 - Stable with comprehensive reporting
- Sprint 3 Week 1 complete (2 weeks ahead of schedule)
- Next: Performance optimization and UI polish

## 🤝 Contributing

This is a private project for university career services. For questions or issues:
1. Check the [troubleshooting guide](docs/development/TROUBLESHOOTING.md)
2. Review the [documentation index](docs/INDEX.md)
3. Contact the development team

## 📝 License

Private and confidential - for authorized use only.