# Use an official Node runtime as a parent image
FROM node:16

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy all source files
COPY . .

# Install dependencies
RUN npm install

# Compile TypeScript to JavaScript
RUN npm run build

RUN rm -rf node_modules

RUN npm install --omit=dev

# Default port at 3030
ARG PORT=3030

# Expose the service on provided port
EXPOSE $PORT

# Command to run the application
CMD ["node", "dist/app.js"]
