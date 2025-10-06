# Use Node.js 18
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for building)
RUN npm install

# Copy all source files
COPY . .

# Build the TypeScript code
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data && chmod 777 /app/data

# Copy the database file to a temporary location
COPY data/career_services.db /tmp/career_services.db

# Expose port
EXPOSE 8080

# Start script that copies database if needed and starts the app
CMD sh -c "if [ ! -s /app/data/career_services.db ]; then cp /tmp/career_services.db /app/data/career_services.db; fi && node dist/server.js"