# 🚀 DEPLOYMENT MIGRATION GUIDE
## From Old Repository to Clean New Repository

### 📊 **CURRENT STATUS**

✅ **New Repository**: https://github.com/dhatzige/Career_Services_Personal_CRM_v1  
✅ **Local Codebase**: Clean, secure, production-ready  
✅ **Builds**: Frontend ✅ Backend ✅  
⚠️ **Deployments**: Still pointing to old problematic repository  

### 🎯 **MIGRATION STRATEGY: UPDATE IN PLACE**

**Best Practice Approach**: Update existing deployments to use new repository
- ✅ **Keeps same URLs** (no broken links)
- ✅ **Preserves database** (Fly.io persistent volume)
- ✅ **Zero downtime** (rolling deployment)
- ✅ **Same environment variables** (already secure)

---

## 🛠️ **STEP-BY-STEP MIGRATION**

### **PHASE 1: BACKEND DEPLOYMENT (Fly.io)** 

#### **What I've Prepared:**
- ✅ Backend build tested and working
- ✅ Deployment script ready (`scripts/deploy-backend.sh`)
- ✅ fly.toml configuration verified
- ✅ GitHub Actions workflow ready

#### **Your Actions Required:**
```bash
# 1. Navigate to backend directory
cd backend

# 2. Authenticate with Fly.io (if not already)
fly auth login

# 3. Verify current app status
fly status

# 4. Deploy clean codebase (CRITICAL: This replaces old problematic code)
fly deploy

# 5. Verify deployment
fly logs
curl https://career-services-personal-crm.fly.dev/health
```

**Expected Result**: Backend will be updated with clean, secure code

---

### **PHASE 2: FRONTEND DEPLOYMENT (Vercel)**

#### **Option A: Vercel Dashboard (Recommended)**
1. **Go to**: https://vercel.com/dashboard
2. **Find current project**: Look for your existing deployment
3. **Update Git Repository**:
   - Settings → Git
   - Change repository to: `dhatzige/Career_Services_Personal_CRM_v1`
   - Branch: `main`
4. **Redeploy**: Trigger new deployment

#### **Option B: Fresh Import**
1. **Import New Project**:
   - Dashboard → "Add New..." → Project
   - Import Git Repository: `dhatzige/Career_Services_Personal_CRM_v1`
   - Framework: Vite
   - Root Directory: `./`

2. **Configure Environment Variables**:
   ```
   VITE_SUPABASE_URL=https://tvqhnpgtpmleaiyjewmo.supabase.co
   VITE_SUPABASE_ANON_KEY=[your-anon-key]
   VITE_API_URL=https://career-services-personal-crm.fly.dev
   VITE_SENTRY_DSN=[your-sentry-dsn]
   VITE_ENABLE_AI_FEATURES=true
   VITE_ENABLE_CALENDLY=true
   ```

3. **Deploy**: Click "Deploy"

---

## 🔧 **CONFIGURATION UPDATES**

### **Backend Environment Variables (Fly.io)**
Current variables should remain the same - they're already secure:
```bash
# Check current secrets
fly secrets list

# If frontend URL changes, update:
fly secrets set FRONTEND_URL=https://your-new-vercel-url.vercel.app
```

### **CORS Update (if needed)**
If frontend URL changes, update backend CORS:
```typescript
// backend/src/server.ts - Already configured to handle Vercel patterns
const corsOptions = {
  origin: [
    /^https:\/\/.*\.vercel\.app$/,  // Handles any Vercel URL
    'http://localhost:5173'
  ]
};
```

---

## 🧪 **VERIFICATION CHECKLIST**

### **Backend Health Check**
```bash
# 1. Health endpoint
curl https://career-services-personal-crm.fly.dev/health

# 2. API connectivity  
curl https://career-services-personal-crm.fly.dev/api/students

# 3. Check logs
fly logs --app career-services-personal-crm
```

### **Frontend Verification**
- [ ] App loads at new Vercel URL
- [ ] Login with Supabase works
- [ ] API calls to backend succeed
- [ ] All features functional (Students, Calendar, etc.)
- [ ] Dark mode toggle works
- [ ] No console errors

### **Integration Testing**
- [ ] Supabase authentication works
- [ ] Backend API responses correctly
- [ ] CORS allows frontend → backend calls
- [ ] Database operations work
- [ ] File uploads work (if using)

---

## 🔄 **ROLLBACK PLAN** (If Issues Occur)

### **Backend Rollback**
```bash
# View deployment history
fly releases

# Rollback to previous version
fly releases rollback [version-number]
```

### **Frontend Rollback**
- Vercel Dashboard → Deployments → Previous deployment → "Promote to Production"

---

## 🎯 **AUTOMATION READY**

### **GitHub Actions (Already Configured)**
- ✅ **Security Scanning**: Runs on every push
- ✅ **Dependency Updates**: Dependabot configured
- ✅ **Automated Deployment**: Triggers on main branch pushes
- ✅ **Build Testing**: Verifies builds before deployment

### **Secrets Required in GitHub** (One-time setup)
```
FLY_API_TOKEN=your-fly-api-token
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-vercel-org-id
VERCEL_PROJECT_ID=your-vercel-project-id
```

---

## ⚡ **QUICK DEPLOYMENT COMMANDS**

```bash
# Backend deployment (from project root)
cd backend && fly deploy

# Frontend deployment (if using Vercel CLI)
vercel --prod

# Full automation (after GitHub secrets are set)
git push origin main  # Triggers automated deployment
```

---

## 🏆 **POST-DEPLOYMENT SUCCESS CRITERIA**

- ✅ Backend health check: https://career-services-personal-crm.fly.dev/health
- ✅ Frontend loads without errors
- ✅ User can log in successfully
- ✅ Student management features work
- ✅ No console errors or warnings
- ✅ All integrations (Calendly, AI) functional

---

## 🚨 **CRITICAL REMINDERS**

1. **Database Preservation**: Fly.io persistent volume preserves your data
2. **Environment Variables**: Already secure, reuse existing values
3. **Clean Codebase**: New repository has zero sensitive data
4. **Professional Appearance**: Repository ready for public showcase
5. **Security Compliance**: All vulnerabilities resolved

**Ready to execute! Let's migrate to the clean repository deployment! 🚀**