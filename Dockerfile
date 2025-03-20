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

# Debug environment variables and files
ARG BUILD_ENV=development
RUN echo "BUILD_ENV = ${BUILD_ENV}"
RUN ls -la .env*
RUN cat .env.${BUILD_ENV}
RUN cp .env.${BUILD_ENV} .env
RUN cat .env

# Create a runtime config file
RUN echo "window.RUNTIME_CONFIG = { API_BASE_URL: 'http://localhost/api', WS_BASE_URL: 'ws://localhost/api' };" > public/runtime-config.js

# Build for the specified environment
RUN npm run build

# Debug the built files to see if variables were injected
RUN grep -r "paul-service.nomadriver.co" build/ || echo "No production URL found in build"

# Step 2: Serve the React app using nginx
FROM nginx:alpine

# Copy the custom nginx.conf file into the container
COPY nginx.conf /etc/nginx/nginx.conf

# Copy the build output from the first stage to the nginx server
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 8080 for the nginx server to serve the app
EXPOSE 8080

# Default command to run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
