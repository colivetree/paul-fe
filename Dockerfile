# Step 1: Build stage using Node.js
FROM node:18.9.1 AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies (without devDependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Set environment variables based on BUILD_ENV
ARG BUILD_ENV=development
ENV NODE_ENV=${BUILD_ENV}

# Debug environment variables
RUN echo "BUILD_ENV = ${BUILD_ENV}"
RUN echo "NODE_ENV = ${NODE_ENV}"
RUN ls -la .env*
RUN printenv | grep NODE

# Create a runtime config file based on environment
RUN if [ "$BUILD_ENV" = "development" ]; then \
      echo "window.RUNTIME_CONFIG = { API_BASE_URL: 'http://localhost/api', WS_BASE_URL: 'ws://localhost/api' };" > public/runtime-config.js; \
    else \
      echo "window.RUNTIME_CONFIG = { API_BASE_URL: 'https://paul-service.nomadriver.co/api', WS_BASE_URL: 'wss://paul-service.nomadriver.co/api' };" > public/runtime-config.js; \
    fi

# Build for the specified environment
RUN if [ "$BUILD_ENV" = "development" ]; then \
      npm run build:dev; \
    else \
      npm run build:prod; \
    fi

# Debug the built files to see if variables were injected
RUN grep -r "paul-service.nomadriver.co" build/ || echo "No production URL found in build"

# Step 2: Serve the React app using nginx
FROM nginx:alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy the custom nginx configuration
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy the build output from the first stage to the nginx server
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 8080 for the nginx server to serve the app
EXPOSE 8080

# Default command to run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
