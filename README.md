# Career Services CRM - Modern Student Management System

> A comprehensive, production-ready CRM system for university career services to track student consultations, manage career development, and analyze engagement patterns.

[![Live Demo](https://img.shields.io/badge/🌐_Live_Demo-Available-brightgreen)](https://project-l84ibkcxy-dimitris-projects-74509e82.vercel.app)
[![Backend API](https://img.shields.io/badge/🔗_API-Running-blue)](https://career-services-personal-crm.fly.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue)](https://reactjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

## 🚀 **Live System**

**🎯 Current Version**: v0.13.0 (August 14, 2025)  
**🌐 Frontend**: [Live Demo on Vercel](https://project-l84ibkcxy-dimitris-projects-74509e82.vercel.app)  
**🔗 Backend API**: [Production API on Fly.io](https://career-services-personal-crm.fly.dev)  
**🔐 Authentication**: Secure Supabase integration  

## ✨ **Key Features**

### 📋 **Student Management**
- **Comprehensive profiles** with academic and career tracking
- **Real-time status updates** for job search progress
- **Notes system** with multiple types and tagging
- **Recently viewed** student quick access
- **Advanced search and filtering** across all student data

### 📅 **Consultation Tracking**
- **Today's Schedule** - Clean, focused daily view
- **Calendar integration** with Calendly for automatic booking sync
- **Attendance tracking** with no-show pattern detection
- **Meeting types** and outcome tracking
- **Real-time status updates** (scheduled, attended, no-show, cancelled)

### 📊 **Advanced Analytics** 
- **Interactive dashboards** with student engagement metrics
- **Program performance analysis** with smart abbreviations
- **Consultation trends** and attendance patterns
- **AI-powered insights** for strategic recommendations
- **Export capabilities** for further analysis

### 🔧 **Data Management**
- **Complete CSV exports** with all student data, notes, and consultations
- **System backups** in JSON format for migration/disaster recovery
- **Import functionality** with validation and duplicate protection
- **Proper field mapping** aligned with database structure

### 🎨 **Professional Interface**
- **Modern React UI** with TypeScript throughout
- **Dark/Light theme** switching with accessibility options
- **Responsive design** for desktop and mobile
- **Real-time updates** across all components
- **Professional chart visualizations** with Recharts

## 🏗️ **Architecture**

### **Hybrid Database Approach**
```
Frontend (React/Vite) → Backend API (Express) → SQLite (data) + Supabase (auth only)
                                ↓
                        TypeScript Backend
                          /backend/*
```

### **Technology Stack**
- **Frontend**: React 18.3, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Backend**: Express, TypeScript, SQLite, better-sqlite3
- **Authentication**: Supabase (invite-only system)
- **Monitoring**: Sentry error tracking
- **Email**: Resend API integration
- **AI**: Anthropic Claude API for insights
- **Deployment**: Vercel (frontend) + Fly.io (backend)

### **Security Features**
- **Row Level Security (RLS)** on all Supabase tables
- **Invite-only registration** with role-based access control
- **Secure API endpoints** with authentication middleware
- **Data encryption** in transit and at rest
- **Audit logging** for security events

## 🚦 **Getting Started**

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- SQLite3
- Supabase account (for auth)

### **Quick Start**
```bash
# Clone the repository
git clone https://github.com/dhatzige/Career_Services_Personal_CRM.git
cd Career_Services_Personal_CRM

# Install dependencies
npm install

# Start both servers
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:4001
```

### **Environment Setup**
```bash
# Frontend (.env)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_SENTRY_DSN=your_frontend_sentry_dsn

# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
CLAUDE_API_KEY=your_claude_api_key
CALENDLY_API_KEY=your_calendly_api_key
SENTRY_DSN=your_backend_sentry_dsn
```

## 📈 **Production Metrics**

- **🎯 Zero Production Errors** (Sentry confirmed)
- **⚡ Fast Performance** (~200ms API response, ~2s initial load)
- **📱 Mobile Responsive** with full feature parity
- **🔒 Enterprise Security** with comprehensive RLS policies
- **📊 Comprehensive Analytics** with 10+ chart types and AI insights

## 🔗 **Integrations**

### **Current Integrations**
- **✅ Calendly** - Automatic meeting sync and student creation
- **✅ Supabase** - Authentication and user management
- **✅ Sentry** - Error tracking and performance monitoring
- **✅ Claude AI** - Intelligent insights and report generation

### **Planned Integrations**
- Email providers (Gmail, Outlook)
- Student Information Systems (SIS)
- Zapier for workflow automation
- RESTful API for custom integrations

## 📊 **Feature Showcase**

### **Dashboard**
Advanced analytics with student engagement metrics, program performance analysis, and AI-generated insights.

### **Students Management** 
Comprehensive student profiles with real-time updates, advanced filtering, and grid/table view options.

### **Calendly Integration**
Automatic student creation from meeting bookings with smart data extraction and consultation scheduling.

### **Data Export/Import**
Professional CSV exports with all student data, notes, and consultations. Includes comprehensive import validation.

## 🛠️ **Development**

### **Available Scripts**
```bash
npm run dev              # Start both frontend and backend
npm run dev:frontend     # Frontend only (port 5173)
npm run dev:backend      # Backend only (port 4001)
npm run build           # Build for production
npm run test            # Run Playwright tests
npm run lint            # Code quality check
```

### **Database**
```bash
# Database location
./backend/data/career_services.db

# View data
cd backend && sqlite3 data/career_services.db
.tables
.schema students
```

## 📝 **Documentation**

- **📋 API Reference**: `/docs/current/API_REFERENCE.md`
- **🏗️ Architecture**: `/docs/current/ARCHITECTURE_OVERVIEW.md`
- **🚀 Deployment**: `/docs/setup/DEPLOYMENT_GUIDE.md`
- **🔧 Development**: `/docs/development/`

## 🤝 **Contributing**

This is a portfolio project showcasing modern full-stack development practices. Feel free to explore the code, suggest improvements, or use it as a learning resource.

### **Key Highlights**
- **Clean Architecture** with proper separation of concerns
- **TypeScript Throughout** for type safety and maintainability
- **Comprehensive Testing** with E2E Playwright tests
- **Security Best Practices** with RLS and proper authentication
- **Production Ready** with live deployments and monitoring

## 📄 **License**

MIT License - feel free to use this project as a learning resource or adapt for your own needs.

## 👤 **Author**

**Dimitris Chatzigeorgiou**  
- 📧 Email: dhatzige@act.edu
- 🔗 LinkedIn: [Connect with me](https://linkedin.com/in/dimitris-chatzigeorgiou)
- 🌐 Portfolio: [View my work](https://github.com/dhatzige)

---

*Built with ❤️ for efficient career services management*