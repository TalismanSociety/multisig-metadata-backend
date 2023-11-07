# Use an official Node runtime as a parent image
FROM node:16

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json for installing dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the TypeScript configuration
COPY tsconfig.json ./

# Copy all source files
COPY . .

# Compile TypeScript to JavaScript
CMD ["npm", "run", "build"]

# Expose the service on port 3000
EXPOSE 3030

# Command to run the application
CMD ["node", "dist/app.js"]
