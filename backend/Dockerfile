# Base Node.js image (lightweight)
FROM node:18-alpine  

# Working directory inside container
WORKDIR /app  

# Install wget for health checks
RUN apk add --no-cache wget

# Copy package files (enables build caching)
COPY package*.json ./  

# Install dependencies (clean, reproducible install from package-lock.json; skips dev dependencies like nodemon)
RUN npm ci --production

# Copy application source code
COPY . .  

# Container listens on port 5000
EXPOSE 5000  

# Start the application
CMD ["node", "server.js"]