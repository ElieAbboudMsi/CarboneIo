# Use an official Node.js runtime as a parent image
FROM node:16

# Install LibreOffice and clean up to reduce image size
RUN apt-get update && apt-get install -y \
    libreoffice \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Link LibreOffice for accessibility
RUN ln -s /usr/lib/libreoffice /opt/libreoffice7.2

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the carbone library folder to the working directory
COPY carbone /usr/src/app/carbone

# Copy the rest of the application code to the working directory
COPY . .

# Ensure that the templates directory exists
RUN mkdir -p /usr/src/app/templates

# Link the carbone library (assuming it's local)
RUN npm link carbone

# Expose the port the app runs on
EXPOSE 5000

# Command to run the application
CMD ["node", "server.js"]
