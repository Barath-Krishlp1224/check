FROM node:18

# Set working directory
WORKDIR /app

# Copy package files first (for cached installs)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build Next.js app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app in production mode
CMD ["npm", "start"]
