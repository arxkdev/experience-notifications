# Use Node.js LTS (Long Term Support) as base image
FROM node:20-slim

# Install wget and curl for healthchecks
RUN apt-get update && apt-get install -y wget curl && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 3031

# Command to run the application
CMD ["npm", "start"]
