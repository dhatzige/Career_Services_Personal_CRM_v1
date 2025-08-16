# Production Deployment Checklist & Next Steps

## 1. Set Up Production Database
- Provision a PostgreSQL database (cloud or self-hosted)
- Update your `.env` file with production DB credentials

## 2. Build and Run Docker Container
- Build the Docker image:
  ```bash
  docker build -t personal-crm-backend .
  ```
- Run the container:
  ```bash
  docker run -d --name personal-crm-backend -p 3001:3001 --env-file .env personal-crm-backend
  ```
- (Optional) Use Docker Compose to orchestrate backend and database

## 3. Point Frontend to Backend API
- Update your frontend config to use the backend API URL (e.g., `https://yourdomain.com/api`)

## 4. Test All Endpoints in Production
- Use Postman or your frontend to test all API endpoints
- Confirm authentication, CRUD, dashboard, and AI endpoints work

## 5. Monitor Logs and Health
- Check logs for errors after deployment
- Use `/api/dashboard/health` endpoint for health checks

## 6. Security & Best Practices
- Never commit `.env` to version control
- Use strong secrets for JWT and session
- Set up HTTPS for your domain
- Restrict CORS to your frontend domain

## 7. (Optional) Staging Environment
- Set up a staging environment to test before production

## 8. (Optional) Docker Compose Example
- If you want to run backend and database together:
  ```yaml
  version: '3.8'
  services:
    db:
      image: postgres:15
      environment:
        POSTGRES_DB: personal_crm
        POSTGRES_USER: crm_user
        POSTGRES_PASSWORD: your_secure_password_here
      ports:
        - "5432:5432"
      volumes:
        - db_data:/var/lib/postgresql/data
    backend:
      build: .
      ports:
        - "3001:3001"
      env_file:
        - .env
      depends_on:
        - db
  volumes:
    db_data:
  ```

---

**Follow these steps for a smooth production deployment!** 