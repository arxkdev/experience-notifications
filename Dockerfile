# Use Node.js LTS (Long Term Support) as base image
FROM node:20-slim

# Install wget and curl for healthchecks, and pnpm
RUN apt-get update && apt-get install -y wget curl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and pnpm-lock.yaml
COPY package*.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Expose the port the app runs on
EXPOSE 3031

# Command to run the application
CMD ["pnpm", "start"]
