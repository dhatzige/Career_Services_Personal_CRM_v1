# Development Plan & Task Tracker
**Created**: December 13, 2025
**Current Version**: 0.12.2
**Production URL**: https://project-l84ibkcxy-dimitris-projects-74509e82.vercel.app

## 🎯 Current Issues & Task List

### CRITICAL BUGS (Production Breaking)
| ID | Task | Status | Branch | Test Criteria |
|---|---|---|---|---|
| CRITICAL-1 | Fix Today's Schedule - meetings not showing (12:00 PM GR time meeting missing) | 🔴 PENDING | `fix/todays-schedule` | Meeting appears in Today's Schedule view |
| CRITICAL-2 | Fix Calendar page - not working/loading | 🔴 PENDING | `fix/calendar-page` | Calendar page loads and displays data |
| CRITICAL-3 | Fix Dashboard data - not updating with correct information | 🔴 PENDING | `fix/dashboard-data` | Dashboard shows accurate counts |

### UI CLEANUP (Remove Unnecessary Elements)
| ID | Task | Status | Branch | Location |
|---|---|---|---|---|
| CLEANUP-1 | Remove Dashboard Quick Actions (Add Student, Quick Note, View Reports) | 🔴 PENDING | `cleanup/dashboard-actions` | Dashboard.tsx |
| CLEANUP-2 | Remove Dashboard Recommended Actions section entirely | 🔴 PENDING | `cleanup/dashboard-actions` | Dashboard.tsx |
| CLEANUP-3 | Remove Analytics Recommended Actions section | 🔴 PENDING | `cleanup/analytics-actions` | AnalyticsPage.tsx |

## 📋 Development Methodology

### 1. ENVIRONMENT SETUP (Before Each Session)
```bash
# ALWAYS create backup first
cp backend/data/career_services.db backend/data/career_services_backup_$(date +%Y%m%d).db

# Start local servers
cd backend && npm run dev  # Terminal 1 - Backend on port 4001
npm run dev:frontend       # Terminal 2 - Frontend on port 5173

# Verify servers running
curl http://localhost:4001/health  # Should return healthy
# Open http://localhost:5173 in browser
```

### 2. WORKFLOW FOR EACH TASK
```bash
# Step 1: Create feature branch
git checkout main
git pull origin main
git checkout -b [branch-name-from-table]

# Step 2: Make changes
# - Fix the issue
# - Test locally
# - Check browser console for errors

# Step 3: Verify fix
npm run lint           # Frontend linting
cd backend && npm run build  # Backend compilation

# Step 4: Commit with descriptive message
git add .
git commit -m "fix: [description]

- What was broken
- What was changed
- How it was tested

Issue: #[TASK-ID]"

# Step 5: Push immediately
git push origin [branch-name]

# Step 6: Update this document
# Mark task as ✅ COMPLETED with date/time
```

### 3. TESTING PROTOCOL (MANDATORY)

#### Manual Testing Checklist:
- [ ] Feature works as expected
- [ ] No errors in browser console (F12 → Console)
- [ ] No errors in backend terminal
- [ ] Related features still work
- [ ] Dark mode compatible (toggle theme)
- [ ] Data persists after refresh

#### Playwright Testing (When Needed):
```bash
# For visual debugging of specific issue
npx playwright test --headed --project=chromium

# To inspect specific page
npx playwright codegen http://localhost:5173
```

### 4. COMMIT RULES
- **ONE task = ONE commit** (never batch multiple fixes)
- **Push immediately after each task** (prevents context loss)
- **Descriptive commit messages** (explain what, why, how)
- **Reference issue ID** in commit message

## 🔍 Known Issues & Investigation Notes

### Today's Schedule Issue
- **Problem**: Meetings scheduled for today (12:00 PM GR time) not appearing
- **Likely Cause**: Timezone issue or date filtering problem
- **Files to Check**: 
  - `/src/components/TodayView.tsx`
  - `/backend/src/controllers/consultationController.ts`
  - API endpoint: `/api/consultations/date-range`

### Calendar Page Issue
- **Problem**: Calendar page not loading/working
- **Likely Cause**: Component error or API failure
- **Files to Check**:
  - `/src/pages/Calendar.tsx`
  - `/src/components/CalendarView.tsx`
  - API endpoint: `/api/calendar/events`

### Dashboard Data Issue
- **Problem**: Dashboard not showing correct data
- **Likely Cause**: Caching issue or API response problem
- **Files to Check**:
  - `/src/pages/Dashboard.tsx`
  - `/backend/src/controllers/dashboardController.ts`
  - API endpoint: `/api/dashboard/stats`

## 📊 Progress Tracking

### Session Log
| Date | Tasks Completed | Issues Found | Next Priority |
|---|---|---|---|
| 2025-12-13 | Plan created | 6 issues identified | Start with CRITICAL-1 |

### Deployment History
| Date | Version | Changes | Status |
|---|---|---|---|
| 2025-08-12 | 0.12.2 | Analytics fixes, CORS config | ✅ Deployed |

## ⚠️ Important Notes

1. **Database**: SQLite locally, same on production (Fly.io)
2. **Auth**: Supabase (invite-only system)
3. **Timezone**: Greece (UTC+3) - Critical for date/time issues
4. **Master User**: dhatzige@act.edu
5. **Ports**: Backend: 4001 (local) / 8080 (production), Frontend: 5173 (local)

## 🚀 Quick Commands

```bash
# Start everything
npm run dev

# Check for TypeScript errors
cd backend && npm run build

# Run specific Playwright test
npx playwright test tests/todays-schedule.spec.ts --headed

# View production logs (if you have Fly CLI)
fly logs -a career-services-personal-crm

# Emergency rollback
git reset --hard HEAD~1
git push origin main --force
```

## 📝 Definition of Done

A task is ONLY complete when:
- ✅ Bug is fixed locally
- ✅ No console errors
- ✅ No build errors
- ✅ Related features still work
- ✅ Committed with proper message
- ✅ Pushed to GitHub
- ✅ This document updated

---

**NEXT ACTION**: Start with CRITICAL-1 (Fix Today's Schedule)