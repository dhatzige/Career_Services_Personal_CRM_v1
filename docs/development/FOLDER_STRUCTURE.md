# Career Services CRM - Folder Structure Guide

## Overview

This document provides a comprehensive guide to the folder structure of the Career Services CRM project. It's designed to help developers (especially AI assistants) navigate and understand the codebase efficiently.

Last Updated: August 6, 2025

## Root Directory Structure

```
/project/
├── src/                      # Frontend React application source
├── backend/                  # Backend Express server
├── docs/                     # All documentation
├── tests/                    # Active test suites
├── scripts/                  # Build and utility scripts
├── screenshots/              # Organized screenshots
├── test-archive/             # Archived test files
├── OLD_FILES_BACKUP/         # Archived/deprecated code
├── playwright/               # Playwright test configuration
├── public/                   # Static assets
├── dist/                     # Frontend build output
└── [config files]            # Various configuration files
```

## Frontend (`/src`)

### Core Application Structure
```
src/
├── main.tsx                  # Application entry point
├── App.tsx                   # Main app component with routing
├── index.css                 # Global styles
└── vite-env.d.ts            # Vite type definitions
```

### Components (`/src/components`)
```
components/
├── Layout.tsx                # Main layout wrapper
├── ProtectedRoute.tsx        # Auth route protection
├── ErrorBoundary.tsx         # Error handling wrapper
├── LoadingSkeleton.tsx       # Loading states
│
├── [Student Components]
│   ├── StudentCard.tsx       # Grid view card
│   ├── StudentTableView.tsx  # Table view (recently fixed)
│   ├── StudentDetailModal.tsx # Student details popup
│   ├── AddStudentModal.tsx   # Add new student form
│   └── StudentEditForm.tsx   # Edit student form
│
├── [Feature Components]
│   ├── NotesSystem.tsx       # Note management
│   ├── TodayView.tsx         # Daily schedule view
│   ├── CalendlyWidget.tsx    # Calendly integration
│   ├── ImportExportSection.tsx # Import/export UI
│   └── CancellationModal.tsx # Consultation cancellation
│
├── analytics/                # Analytics components
│   ├── AIInsights.tsx        # AI-powered insights
│   └── EngagementMetrics.tsx # Student engagement
│
├── career/                   # Career tracking components
│   ├── CareerDashboard.tsx   # Career overview
│   ├── ApplicationTracker.tsx # Job applications
│   └── MockInterviewTracker.tsx # Interview tracking
│
└── ui/                       # Reusable UI components
    ├── button.tsx            # Button component
    ├── card.tsx              # Card component
    ├── input.tsx             # Input component
    └── [other UI components]
```

### Pages (`/src/pages`)
```
pages/
├── Dashboard.tsx             # Main dashboard (/)
├── StudentsPage.tsx          # Student list (/students)
├── TodayView.tsx            # Today's schedule (/today)
├── AnalyticsPage.tsx        # Analytics dashboard (/analytics)
├── ReportsPage.tsx          # Reports (/reports)
├── CareerPage.tsx           # Career services (/career)
├── SettingsPage.tsx         # Settings (/settings)
├── CleanAuthPage.tsx        # Login page
└── CleanAuthCallback.tsx    # Auth callback handler
```

### Services & Utilities
```
services/
├── api.ts                    # Legacy API client
├── apiClient.ts              # Centralized API client
├── apiCache.ts               # API response caching
└── importExportService.ts    # Import/export logic

utils/
├── supabaseStudents.ts       # Student CRUD operations
├── analytics.ts              # Analytics calculations
├── sentryHelpers.ts          # Sentry integration helpers
├── performance.ts            # Performance monitoring
└── [other utilities]
```

### Types & Contexts
```
types/
├── student.ts                # Student interfaces
├── career.ts                 # Career tracking types
└── tags.ts                   # Tag system types

contexts/
├── CleanSupabaseAuth.tsx     # Auth context provider
└── ThemeContext.tsx          # Dark mode theme context
```

## Backend (`/backend`)

### Core Server Structure
```
backend/
├── src/
│   ├── server.ts             # Express server entry (port 4001)
│   ├── config/               # Configuration
│   │   └── supabase.ts       # Supabase client config
│   │
│   ├── controllers/          # Route handlers
│   │   ├── studentController.ts
│   │   ├── consultationController.ts
│   │   ├── noteController.ts
│   │   ├── reportController.ts
│   │   ├── dashboardController.ts
│   │   └── [other controllers]
│   │
│   ├── models/               # Data models
│   │   ├── Student.ts        # Student model with camelCase transform
│   │   ├── Consultation.ts   # Consultation model
│   │   ├── Note.ts           # Note model
│   │   └── [other models]
│   │
│   ├── routes/               # API routes
│   │   ├── students.ts       # /api/students/*
│   │   ├── consultations.ts  # /api/consultations/*
│   │   ├── notes.ts          # /api/notes/*
│   │   ├── reports.ts        # /api/reports/*
│   │   └── [other routes]
│   │
│   ├── middleware/           # Express middleware
│   │   ├── auth.ts           # Authentication
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── enhancedSecurity.ts # Security middleware
│   │   └── validation.ts     # Request validation
│   │
│   ├── database/             # Database management
│   │   ├── connection.ts     # SQLite connection
│   │   ├── migrations/       # SQL migrations
│   │   └── schema-sqlite.sql # Database schema
│   │
│   └── utils/                # Backend utilities
│       ├── logger.ts         # Winston logger
│       ├── cache.ts          # Redis/memory cache
│       └── monitoring.ts     # Performance monitoring
│
├── data/                     # SQLite database location
│   └── career_services.db    # Main database file
│
└── logs/                     # Application logs
    ├── combined.log
    ├── error.log
    └── [other logs]
```

## Documentation (`/docs`)

### Documentation Organization
```
docs/
├── INDEX.md                  # Documentation index
│
├── current/                  # Active/current documentation
│   ├── API_REFERENCE.md      # Complete API documentation
│   ├── PROJECT_STATUS_AUG6.md # Latest project status
│   ├── SPRINT*.md            # Sprint documentation
│   ├── TASK-*.md             # Task-specific docs
│   └── [other current docs]
│
├── archive/                  # Outdated/historical docs
│   ├── old sprint docs
│   └── deprecated guides
│
├── development/              # Development guides
│   ├── FOLDER_STRUCTURE.md   # This file
│   ├── SECURITY_GUIDE.md     # Security best practices
│   └── TROUBLESHOOTING.md    # Common issues
│
├── guides/                   # User/feature guides
│   └── IMPORT_EXPORT_GUIDE.md # Import/export instructions
│
├── setup/                    # Setup instructions
│   ├── QUICK_START.md        # Getting started
│   ├── DEPLOYMENT_GUIDE.md   # Deployment instructions
│   └── [other setup docs]
│
└── testing/                  # Testing documentation
    └── testing-checklist.md  # What to test
```

## Test Organization

### Active Tests (`/tests`)
```
tests/
├── students-comprehensive.spec.ts # Comprehensive student tests
├── auth.spec.ts              # Authentication tests
├── navigation.spec.ts        # Navigation tests
└── [other active tests]
```

### Archived Tests (`/test-archive`)
```
test-archive/
├── old test files
├── deprecated HTML tests
└── experimental scripts
```

### Playwright Tests (`/playwright/tests`)
```
playwright/tests/
├── e2e test files
└── integration tests
```

## Scripts (`/scripts`)

```
scripts/
├── setup/                    # Setup and initialization scripts
│   ├── start-dev.sh         # Start development servers
│   └── setup.sh             # Initial setup
│
└── dev/                      # Development utilities
    └── run-*.sh             # Various run scripts
```

## Screenshots (`/screenshots`)

```
screenshots/
├── auth/                     # Authentication flow screenshots
├── dashboard/                # Dashboard screenshots
├── students/                 # Student page screenshots
├── errors/                   # Error state screenshots
└── current-state.png         # Latest app state
```

## Configuration Files (Root)

### Build & Development
- `vite.config.ts` - Vite configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `eslint.config.js` - ESLint rules

### Package Management
- `package.json` - Frontend dependencies
- `backend/package.json` - Backend dependencies

### Deployment
- `Dockerfile` - Frontend container
- `backend/Dockerfile` - Backend container
- `docker-compose.yml` - Multi-container setup
- `nginx.conf` - Nginx configuration

### Testing
- `playwright.config.ts` - Main Playwright config
- Various other playwright configs

### Documentation
- `README.md` - Project readme
- `CHANGELOG.md` - Version history
- `CLAUDE.md` - AI assistant context
- `HANDOFF_MESSAGE.md` - Session handoff notes

## Important Notes

### File Naming Conventions
- Components: PascalCase (e.g., `StudentCard.tsx`)
- Utilities: camelCase (e.g., `supabaseStudents.ts`)
- Documentation: SCREAMING_SNAKE_CASE (e.g., `API_REFERENCE.md`)
- SQL files: snake_case (e.g., `add_noshow_tracking.sql`)

### Data Flow
1. Frontend makes API calls to backend (port 4001)
2. Backend transforms snake_case (DB) to camelCase (API)
3. Frontend expects camelCase properties
4. Supabase used ONLY for authentication

### Key Locations
- **Database**: `/backend/data/career_services.db`
- **API Docs**: `/docs/current/API_REFERENCE.md`
- **Latest Status**: `/docs/current/PROJECT_STATUS_AUG6.md`
- **AI Context**: `/CLAUDE.md`

### Backup & Archive Strategy
- Old code goes to `/OLD_FILES_BACKUP/`
- Old tests go to `/test-archive/`
- Old docs go to `/docs/archive/`
- Screenshots organized by feature area

This structure supports efficient navigation and maintenance of the codebase, especially for AI assistants working on the project.