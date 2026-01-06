# Production Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (for caching)
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

# Copy build from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

# Create a non-root user for security
RUN addgroup -S nodejs && adduser -S nestjs -G nodejs
RUN chown -R nestjs:nodejs /app
USER nestjs

EXPOSE 3000

# Start command
CMD ["node", "dist/main.js"]
