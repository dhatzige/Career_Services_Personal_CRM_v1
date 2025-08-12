# Career Services CRM Backend

A robust Node.js + Express backend with **SQLite** database for the Career Services CRM application.

## 🚀 Features

- **RESTful API** with comprehensive endpoints for students, notes, consultations, and more
- **SQLite Database** - Lightweight, file-based database (no server setup needed!)
- **Supabase Authentication** - Secure, invite-only user management
- **Input Validation** using express-validator
- **AI Integration** with Claude API for insights and reports
- **TypeScript** for type safety and better development experience
- **Security** with helmet, CORS, and rate limiting
- **Comprehensive Error Handling** with detailed error responses
- **Sentry Integration** for error monitoring

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for authentication)

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory (copy from `.env.example`):
   ```bash
   # Supabase Configuration (for Authentication ONLY)
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # Server Configuration
   PORT=4001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Security
   SESSION_SECRET=generate-a-strong-random-string-here
   CSRF_SECRET=generate-another-strong-random-string-here
   JWT_SECRET=generate-a-third-strong-random-string-here

   # API Keys
   CLAUDE_API_KEY=your-claude-api-key
   RESEND_API_KEY=your-resend-api-key
   SENTRY_DSN=your-sentry-dsn

   # Master Account (for initial setup)
   MASTER_EMAIL=your-email@example.com
   MASTER_PASSWORD=your-secure-password
   ```

3. **Database is automatic!**
   - SQLite database is created automatically when you first run the server
   - Located at: `data/career_services.db`
   - No database server needed - it's just a file!

## 🏃‍♂️ Running the Server

### Development
```bash
npm run dev
```
Server runs on http://localhost:4001

### Production
```bash
npm run build
npm start
```

## 🗄️ Database Information

### What is SQLite?
- **SQLite** is a lightweight, file-based database
- No separate database server needed (unlike PostgreSQL or MySQL)
- Perfect for small to medium applications
- Your data is stored in a single file: `data/career_services.db`

### Why SQLite + Supabase?
- **SQLite** stores all your CRM data (students, notes, consultations)
- **Supabase** handles authentication only (login system)
- This hybrid approach gives you the best of both worlds:
  - Simple local data storage with SQLite
  - Professional authentication with Supabase

### Database Tables
- **students** - Student information and academic details
- **notes** - Student notes with various types
- **consultations** - Meeting records with attendance tracking
- **follow_up_reminders** - Tasks and reminders
- **activity_log** - System activity tracking
- **users** - User profiles (auth handled by Supabase)

## 🔌 Main API Endpoints

### Students
- `GET /api/students` - Get all students
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Consultations
- `GET /api/consultations/student/:studentId` - Get student's consultations
- `POST /api/consultations/student/:studentId` - Schedule consultation
- `PUT /api/consultations/:id` - Update consultation

### Notes
- `GET /api/notes/student/:studentId` - Get student's notes
- `POST /api/notes/student/:studentId` - Add note
- `PUT /api/notes/:id` - Update note

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity

### Team Management (Master User Only)
- `GET /api/team/members` - List team members
- `POST /api/team/invite` - Send invitation
- `DELETE /api/team/member/:id` - Remove team member

## 🛡️ Security Features

- **Invite-only registration** - No public signups
- **Master user control** - One admin controls all invitations
- **JWT Authentication** with Supabase
- **Rate limiting** to prevent abuse
- **Input validation** on all endpoints
- **CORS protection** 
- **SQL injection prevention** 

## 📁 Project Structure
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── database/        # SQLite setup and migrations
│   ├── middleware/      # Auth, security, validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/        # External services (Claude, Email)
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── data/
│   └── career_services.db  # SQLite database file
├── dist/                # Compiled JavaScript
├── package.json
└── README.md
```

## 🚀 Deployment Notes

1. **Database Backup**: Always backup `data/career_services.db` before updates
2. **Environment Variables**: Never commit `.env` file
3. **Master Account**: First user registered becomes the master admin
4. **Supabase Setup**: Required for authentication to work

## 📊 Key Features for Non-Developers

- **No complex database setup** - SQLite just works!
- **All data stored locally** in one file
- **Easy backup** - just copy the database file
- **Supabase handles passwords** securely
- **Professional error tracking** with Sentry

## 🔍 Monitoring

- **Sentry Integration** for error tracking
- Check errors at: https://de.sentry.io (organization: act-l6)

## 📞 Support

For issues or questions:
1. Check the `docs/` folder for guides
2. Review `TROUBLESHOOTING.md`
3. Create an issue on GitHub

---
*Built with Node.js, Express, TypeScript, SQLite, and Supabase*