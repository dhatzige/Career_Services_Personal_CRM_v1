# Personal CRM Backend

A robust Node.js + Express backend with PostgreSQL for the Personal CRM application.

## 🚀 Features

- **RESTful API** with comprehensive endpoints for students, notes, consultations, and more
- **PostgreSQL Database** with proper relationships and indexes
- **JWT Authentication** with secure user management
- **Input Validation** using express-validator
- **AI Integration** ready for Claude API integration
- **TypeScript** for type safety and better development experience
- **Security** with helmet, CORS, and rate limiting
- **Comprehensive Error Handling** with detailed error responses
- **Database Migrations** with automated setup scripts

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the backend directory:
   ```bash
   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/personal_crm
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=personal_crm
   DB_USER=crm_user
   DB_PASSWORD=your_secure_password_here

   # Server Configuration
   PORT=3001
   NODE_ENV=development

   # Authentication
   JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
   JWT_EXPIRES_IN=24h
   BCRYPT_ROUNDS=12

   # CORS Configuration
   FRONTEND_URL=http://localhost:5173

   # Claude AI API (for AI reports)
   CLAUDE_API_KEY=your_claude_api_key_here

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

3. **Set up PostgreSQL database:**
   ```bash
   # Create database and user
   psql -U postgres
   CREATE DATABASE personal_crm;
   CREATE USER crm_user WITH PASSWORD 'your_secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE personal_crm TO crm_user;
   ```

4. **Run database migrations:**
   ```bash
   npm run db:migrate migrate
   ```

## 🏃‍♂️ Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## 🗄️ Database Management

### Available Commands
```bash
# Run migrations
npm run db:migrate migrate

# Check database status
npm run db:migrate check

# Create indexes
npm run db:migrate index

# Drop all tables
npm run db:migrate drop

# Reset database (drop and recreate)
npm run db:migrate reset
```

## 🔌 API Endpoints

### Authentication
- `GET /api/auth/status` - Check system configuration
- `POST /api/auth/setup` - Initial system setup
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password
- `PUT /api/auth/profile` - Update profile
- `POST /api/auth/logout` - Logout

### Students
- `GET /api/students` - Get all students
- `POST /api/students/search` - Search students with filters
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `GET /api/students/stats/overview` - Get student statistics
- `POST /api/students/bulk` - Bulk operations

### Notes
- `GET /api/notes/student/:studentId` - Get notes for student
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes/student/:studentId` - Create note for student
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note
- `GET /api/notes/stats/overview` - Get notes statistics

### Consultations
- `GET /api/consultations/student/:studentId` - Get consultations for student
- `GET /api/consultations/:id` - Get consultation by ID
- `POST /api/consultations/student/:studentId` - Create consultation for student
- `PUT /api/consultations/:id` - Update consultation
- `DELETE /api/consultations/:id` - Delete consultation
- `GET /api/consultations/date-range/:startDate/:endDate` - Get consultations in date range
- `GET /api/consultations/stats/overview` - Get consultation statistics

### Dashboard
- `GET /api/dashboard/stats` - Get comprehensive dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity feed
- `GET /api/dashboard/metrics` - Get performance metrics
- `GET /api/dashboard/upcoming` - Get upcoming consultations
- `GET /api/dashboard/health` - System health check

### AI Reports
- `POST /api/ai/report` - Generate AI report
- `GET /api/ai/insights/student/:studentId` - Get AI insights for student
- `GET /api/ai/recommendations` - Get AI recommendations

### Health Check
- `GET /health` - Server health check (no auth required)

## 🛡️ Security Features

- **JWT Authentication** with secure token generation
- **Password Hashing** using bcrypt with salt
- **Rate Limiting** to prevent abuse
- **Input Validation** on all endpoints
- **CORS Protection** with configurable origins
- **SQL Injection Prevention** using parameterized queries
- **Security Headers** with helmet middleware

## 📊 Database Schema

### Core Tables
- **users** - User authentication and profile data
- **students** - Student information and academic details
- **notes** - Student notes with type categorization
- **consultations** - Consultation records with attendance tracking
- **follow_up_reminders** - Follow-up reminders and tasks
- **activity_logs** - System activity and audit logs

### Relationships
- Students → Notes (one-to-many)
- Students → Consultations (one-to-many)
- Students → Follow-up Reminders (one-to-many)
- All tables → Activity Logs (audit trail)

## 🔧 Development

### Project Structure
```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── database/        # Database connection and migrations
│   ├── middleware/      # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── server.ts        # Main server file
├── dist/               # Compiled JavaScript
├── package.json
├── tsconfig.json
└── README.md
```

### Code Quality
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Error Handling** with comprehensive error responses
- **Logging** with structured console output

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- Database credentials
- JWT secret (use a strong, random key)
- CORS origin (your frontend URL)
- Claude API key (for AI features)

### Database Setup
1. Create PostgreSQL database
2. Set up database user with appropriate permissions
3. Run migrations: `npm run db:migrate migrate`
4. Create indexes: `npm run db:migrate index`

### Security Checklist
- [ ] Change default JWT secret
- [ ] Use strong database passwords
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging

## 📝 API Response Format

All API responses follow this consistent format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description",
  "error": { /* error details */ }
}
```

## 🔍 Monitoring

### Health Checks
- `GET /health` - Basic server health
- `GET /api/dashboard/health` - Detailed system health with metrics

### Logging
- Request logging in development
- Error logging with stack traces
- Database query logging (configurable)

## 📞 Support

For issues or questions, please refer to the project documentation or create an issue in the repository.

## 🏗️ Architecture

The backend follows a clean architecture pattern:
- **Routes** handle HTTP requests and responses
- **Models** manage database operations
- **Middleware** handles cross-cutting concerns
- **Controllers** contain business logic
- **Services** handle external integrations (AI, email, etc.)

This architecture ensures maintainability, testability, and scalability. 