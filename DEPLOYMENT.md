# Deployment Guide - Foodie Backend

This guide provides step-by-step instructions for deploying the Foodie Backend (NestJS + Prisma + PostgreSQL) to a production environment.

## 🏗 Production Architecture

- **App Server**: Node.js (v18+) running the NestJS application.
- **Database**: PostgreSQL (v16+) with the **PostGIS** extension.
- **Cache/Queue**: Redis server for session management and Bull background jobs.
- **Reverse Proxy**: Nginx or similar for SSL termination and load balancing.
- **Process Manager**: PM2 to ensure the application stays alive.

---

## 🚀 Deployment Steps

### 1. Server Preparation
Ensure your server has the necessary dependencies installed:
```bash
# Install Node.js, PostgreSQL, Redis, and PM2
sudo apt update
sudo apt install nodejs npm postgresql redis-server
npm install -g pm2
```

### 2. Environment Configuration
Create a production `.env` file on your server. **Never commit this file.**
```env
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/foodie_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Security
JWT_SECRET=your_hyper_secure_random_string
```

### 3. Database Setup (PostGIS)
The backend requires the PostGIS extension for geospatial queries. Connect to your PostgreSQL instance:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 4. Build & Deploy
On your server (or via CI/CD pipeline):
```bash
# 1. Install dependencies (omit dev dependencies)
npm ci --only=production

# 2. Generate Prisma Client
npx prisma generate

# 3. Run production migrations
npx prisma migrate deploy

# 4. Build the application
npm run build
```

### 5. Running with PM2
Use PM2 to manage the process:
```bash
# Start the app
pm2 start dist/main.js --name foodie-backend

# Ensure it starts on reboot
pm2 save
pm2 startup
```

### 6. Containerized Deployment (Recommended)
For a more stable and isolated environment, use Docker:

```bash
# 1. Build and start all services (App, DB, Redis)
docker-compose up -d --build

# 2. Run migrations inside the container
docker-compose exec api npx prisma migrate deploy
```

---

## 🔍 Post-Deployment Verification

1. **Check Logs**: `pm2 logs foodie-backend`
2. **API Health**: Visit `https://your-domain.com/api/v1` (should return 404/200 if root exists)
3. **Swagger Docs**: Ensure `https://your-domain.com/api` is restricted or accessible as per your policy.

## 🛠 Troubleshooting

- **Database Connection**: Ensure the server IP is whitelisted in your DB security groups.
- **Redis Connection**: Check if Redis is bound to `127.0.0.1` or the correct internal IP.
- **Prisma Schema**: If models change, always run `npx prisma generate` after building.
