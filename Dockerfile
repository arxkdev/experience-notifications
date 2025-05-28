FROM node:23-alpine

# Install wget and curl for healthchecks
RUN apk add --no-cache wget curl

# Install pnpm globally
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
