# Environment Setup

Create a `.env` file in the backend directory with the following variables:

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

# Session Configuration
SESSION_SECRET=your_session_secret_here
SESSION_TIMEOUT=1800000
```

## PostgreSQL Setup

1. Install PostgreSQL on your system
2. Create a database named `personal_crm`
3. Create a user `crm_user` with appropriate permissions
4. Update the `.env` file with your actual database credentials 