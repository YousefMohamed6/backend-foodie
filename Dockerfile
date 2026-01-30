# Production Dockerfile
FROM node:20-slim AS builder

WORKDIR /app

# Install openssl and other build dependencies
RUN apt-get update && apt-get install -y openssl python3 build-essential

# Install dependencies first (for caching)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-slim

WORKDIR /app

# Install openssl (required for Prisma)
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install --omit=dev --legacy-peer-deps
RUN npx prisma@5.22.0 generate

# Copy build from builder
COPY --from=builder /app/dist ./dist
RUN mkdir -p ./uploads

# Create a non-root user for security
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Start command
CMD ["node", "dist/src/main.js"]
