# -----------------------------
# 1. Base Image
# -----------------------------
FROM node:18-alpine

# -----------------------------
# 2. Set working directory
# -----------------------------
WORKDIR /app

# -----------------------------
# 3. Copy package files
# -----------------------------
COPY package*.json ./

# Install dependencies
RUN npm install --production

# -----------------------------
# 4. Copy project files
# -----------------------------
COPY . .

# Ensure uploads directory exists
RUN mkdir -p /app/uploads

# -----------------------------
# 5. Expose Port
# -----------------------------
EXPOSE 4000

# -----------------------------
# 6. Start the server
# -----------------------------
CMD ["node", "server.js"]
