# Use the official Playwright image which includes all dependencies and browsers
FROM mcr.microsoft.com/playwright:v1.54.1-noble

# Set the working directory
WORKDIR /app

# Copy package files for better caching
COPY package*.json ./

# Install dependencies using npm ci for deterministic builds
ENV PUPPETEER_SKIP_DOWNLOAD=1
RUN npm ci

# Copy the rest of the application code
COPY . .

# Environment variables
ENV PORT=5000
ENV HEADLESS=true
ENV AUTO_CLOSE=true
ENV SLOW_MO=100
ENV NODE_ENV=production

# Expose the API port
EXPOSE 5000

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start the application
CMD ["node", "server.mjs"]
