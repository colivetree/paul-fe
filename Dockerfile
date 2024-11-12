# Step 1: Build stage using Node.js
FROM node:18.9.1 AS build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package.json package-lock.json ./

# Install dependencies (without devDependencies)
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the React app for production
RUN npm run build

# Step 2: Serve the React app using nginx
FROM nginx:alpine

# Copy the build output from the first stage to the nginx server
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 8080 for the nginx server to serve the app
EXPOSE 8080

# Default command to run nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
