# Career Services CRM Documentation Index

Welcome to the Career Services CRM documentation. This index provides quick access to all documentation resources.

**Last Updated**: August 6, 2025  
**Current Version**: 0.11.1

## 🚀 Getting Started
- **[Quick Start Guide](setup/QUICK_START.md)** - Get up and running in 5 minutes
- **[Development Setup](setup/RUN_APP.md)** - Detailed development environment setup
- **[Architecture Overview](current/ARCHITECTURE_OVERVIEW.md)** - System design and components
- **[Folder Structure Guide](development/FOLDER_STRUCTURE.md)** 🆕 - Complete project organization

## 📚 Current Documentation
- **[Project Status (Aug 6)](current/PROJECT_STATUS_AUG6.md)** 🔥 - Latest project status
- **[API Reference](current/API_REFERENCE.md)** - Complete API documentation
- **[Sprint 4 Week 2 Status](current/SPRINT4_WEEK2_STATUS.md)** 🔥 - Current sprint progress
- **[AI Context (CLAUDE.md)](../CLAUDE.md)** - AI assistant context and guidelines

## 📋 Sprint Documentation
- **[Sprint 4 Week 2](current/SPRINT4_WEEK2_STATUS.md)** - Current (Aug 5-11) 🔥
- **[Sprint 4 Week 1](current/SPRINT4_WEEK1_STATUS.md)** - Analytics & UI Polish ✅
- **[Sprint 3 Week 2](current/SPRINT3_WEEK2_COMPLETE.md)** - Import/Export & Performance ✅
- **[Sprint 3 Week 1](current/SPRINT3_WEEK1_COMPLETE.md)** - Reports & No-Show Tracking ✅
- **[Sprint 2 Week 1](current/SPRINT2_WEEK1_COMPLETE.md)** - Today's View & API Client ✅

## 🛠️ Development Guides
- **[Folder Structure](development/FOLDER_STRUCTURE.md)** 🆕 - Project organization guide
- **[Security Guide](development/SECURITY_GUIDE.md)** - Security best practices
- **[Troubleshooting](development/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Production Readiness](development/PRODUCTION_READINESS_REPORT.md)** - Deployment checklist
- **[Production Scaling](development/PRODUCTION_SCALING_PLAN.md)** - Scaling strategies

## 🔧 Setup & Configuration
- **[Supabase Setup](setup/SUPABASE_SETUP_GUIDE.md)** - Authentication configuration
- **[Email Setup](setup/EMAIL_SETUP.md)** - Resend API configuration
- **[Calendly Setup](setup/CALENDLY_SETUP.md)** - Calendar integration
- **[Deployment Guide](setup/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Redis Setup](setup/REDIS_SETUP.md)** - Cache configuration (optional)

## 📋 Feature Documentation
- **[Advanced Analytics](current/TASK-014_ADVANCED_ANALYTICS.md)** - Analytics dashboard (v0.11.0)
- **[Consultation Reports](current/TASK-011_CONSULTATION_REPORTS.md)** - Reporting features
- **[Today's View Guide](current/TODAYS_VIEW_USER_GUIDE.md)** - Daily workflow management
- **[Import/Export Guide](guides/IMPORT_EXPORT_GUIDE.md)** - Data import/export
- **[Tag System Design](current/TAG_SYSTEM_DESIGN.md)** - Student tagging system

## 🧪 Testing
- **[Testing Checklist](testing/testing-checklist.md)** - What to test before release
- **[Mock Data Guide](testing/MOCK_DATA_GUIDE.md)** - Working with test data

## 🔗 Quick Links
- **[Changelog](../CHANGELOG.md)** - Version history (v0.11.1 latest)
- **[Handoff Message](../HANDOFF_MESSAGE.md)** - Latest session handoff
- **[Project README](../README.md)** - Project overview

## 📝 Quick Reference

### Running the Application
```bash
# Start both servers
npm run dev

# Or separately:
cd backend && npm run dev  # Backend on :4001
npm run dev:frontend       # Frontend on :5173
```

### Key Environment Variables
```env
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_key
VITE_SENTRY_DSN=your_frontend_dsn

# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SENTRY_DSN=your_backend_dsn
RESEND_API_KEY=your_resend_key
```

### Current Architecture
- **Database**: SQLite for data, Supabase for auth only
- **Backend**: Express + TypeScript on port 4001
- **Frontend**: React + Vite on port 5173
- **Monitoring**: Sentry for error tracking
- **Cache**: Optional Redis or in-memory

## 🔥 Most Important Documents

1. **[Project Status](current/PROJECT_STATUS_AUG6.md)** - Current state and metrics
2. **[API Reference](current/API_REFERENCE.md)** - Complete API documentation
3. **[Folder Structure](development/FOLDER_STRUCTURE.md)** - Navigate the codebase
4. **[CLAUDE.md](../CLAUDE.md)** - AI assistant instructions

## 📁 Archive
- **[Previous Releases](archive/)** - Historical documentation
- **[Migration Guides](archive/)** - Database migration history
- **[Test Reports](archive/)** - Previous test results

---

*Need help? Check the [Troubleshooting Guide](development/TROUBLESHOOTING.md) or review the [Project Status](current/PROJECT_STATUS_AUG6.md).*