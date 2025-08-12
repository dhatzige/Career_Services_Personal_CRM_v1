# Architecture Overview - Career Services CRM

**Last Updated**: August 1, 2025  
**Version**: 0.4.0

## 🏗️ System Architecture

### Overview
The Career Services CRM uses a **hybrid database architecture** that combines the best of both worlds:
- **SQLite** for all application data (fast, flexible, no constraints)
- **Supabase** for authentication only (secure, managed auth)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  Components          │  Services           │  Context           │
│  - StudentsPage      │  - apiClient.ts     │  - SupabaseAuth    │
│  - TodayView         │    (centralized)    │    (auth only)     │
│  - Notes/Calendar    │  - api.ts → client  │                    │
└──────────────────────┴──────────────────────┴──────────────────┘
                                │
                                │ HTTPS + JWT
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  Controllers         │  Services           │  Database          │
│  - studentController │  - Sentry           │  - SQLite (local)  │
│  - noteController    │  - Calendly         │  - connection.ts   │
│  - consultationCtrl  │  - Email            │                    │
└──────────────────────┴──────────────────────┴──────────────────┘
                                │                         │
                                │                         │
                        ┌───────▼────────┐       ┌───────▼────────┐
                        │   SQLite DB    │       │ Supabase Auth  │
                        │  (app data)    │       │  (users only)  │
                        └────────────────┘       └────────────────┘
```

## 🔄 Data Flow

### 1. Authentication Flow
```
User Login → Frontend → Supabase Auth → JWT Token → Backend Verification
```

### 2. Data Operations Flow
```
Frontend Component → API Client → Backend Controller → SQLite Model → Database
```

### 3. Error Handling Flow
```
Error Occurs → Caught by Handler → Logged to Sentry → User-Friendly Toast
```

## 📁 Project Structure

```
project/
├── src/                      # Frontend (React + TypeScript)
│   ├── components/          # React components
│   ├── services/           
│   │   ├── apiClient.ts    # Centralized API client (primary)
│   │   └── api.ts          # Legacy redirect to apiClient
│   ├── contexts/           # React contexts (auth)
│   └── types/              # TypeScript definitions
│
├── backend/                 # Backend (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models (SQLite)
│   │   ├── services/       # External services
│   │   ├── database/       
│   │   │   ├── connection.ts  # SQLite connection
│   │   │   └── adapter.ts     # Simplified auth adapter
│   │   └── middleware/     # Auth, error handling
│   └── data/               # SQLite database file
│
└── docs/                   # Documentation
    ├── current/           # Current documentation
    └── archive/           # Historical docs
```

## 🔐 Security Architecture

### Authentication
- **Provider**: Supabase Auth
- **Method**: JWT tokens
- **Storage**: Secure httpOnly cookies (future)
- **Current**: localStorage (development)

### API Security
- CSRF protection on all endpoints
- Rate limiting (100 requests/15 min)
- Input validation with express-validator
- SQL injection protection (parameterized queries)

### Error Tracking
- **Frontend**: Sentry React integration
- **Backend**: Sentry Node.js integration
- **Features**: Request IDs, breadcrumbs, user context

## 🚀 Key Design Decisions

### 1. Hybrid Database Approach
**Why**: Supabase constraints were blocking development
- SQLite provides flexibility for rapid iteration
- No foreign key constraints = easier development
- Supabase Auth remains for secure user management

### 2. Centralized API Client
**Why**: Consistency and maintainability
- Single source of truth for API calls
- Automatic auth token injection
- Structured error handling with Sentry
- Request ID tracking for debugging

### 3. Direct SQL Queries
**Why**: Simplicity over abstraction
- Removed incomplete ORM-style query builder
- Direct SQL is more predictable
- Better performance for complex queries

## 📊 Performance Considerations

### Frontend
- Lazy loading for large components
- React Query for caching (planned)
- Code splitting for routes
- Optimized bundle size (~477KB gzipped)

### Backend
- Connection pooling for SQLite
- Efficient pagination queries
- Minimal middleware stack
- Quick startup time

### Database
- SQLite file-based (no network latency)
- Indexed common query fields
- JSON fields for flexible data
- Backup/restore capabilities

## 🔄 Recent Changes (v0.4.0)

1. **API Consolidation** (August 1, 2025)
   - Removed 9 duplicate delete implementations
   - Created centralized apiClient.ts
   - All components now use unified API

2. **Database Adapter Simplification**
   - Removed 200+ lines of unused query builder
   - Now only handles auth delegation
   - Direct SQL queries in models

3. **New Features**
   - Today's View for daily workflow
   - Quick attendance marking
   - Meeting link management

## 🎯 Future Architecture Goals

### Short Term (Q3 2025)
- [ ] Implement React Query for caching
- [ ] Add WebSocket for real-time updates
- [ ] Migrate to httpOnly cookies

### Long Term (Q4 2025)
- [ ] Consider PostgreSQL migration
- [ ] Add Redis for session management
- [ ] Implement microservices for scale

## 📚 Related Documentation

- [API Reference](./API_REFERENCE.md)
- [Database Schema](./DATABASE_SCHEMA.md)
- [Deployment Guide](../setup/DEPLOYMENT_GUIDE.md)
- [Security Guide](../development/SECURITY_GUIDE.md)