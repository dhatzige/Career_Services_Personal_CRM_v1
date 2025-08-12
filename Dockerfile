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

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/server.js"]