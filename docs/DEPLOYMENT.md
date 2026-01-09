# Deployment Guide - Foodie Backend

This guide provides instructions for deploying the Foodie Backend (NestJS + Prisma + PostgreSQL) to a production environment.

---

## Production Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| App Server | Node.js (v18+) | NestJS application |
| Database | PostgreSQL (v16+) | Primary data store with PostGIS extension |
| Cache/Queue | Redis | Session management and background jobs |
| Reverse Proxy | Nginx | SSL termination and load balancing |
| Process Manager | PM2 | Keeps application alive |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 3000) |
| `NODE_ENV` | Environment (production/development) |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis server host |
| `REDIS_PORT` | Redis server port |
| `JWT_SECRET` | Secret for JWT token signing |

---

## Deployment Steps

### 1. Server Preparation
Install Node.js, PostgreSQL, Redis, and PM2 on your server.

### 2. Environment Configuration
Create a production `.env` file on your server. Never commit this file to version control.

### 3. Database Setup
- Create PostgreSQL database
- Enable PostGIS extension for geospatial queries

### 4. Build & Deploy
1. Install dependencies (production only)
2. Generate Prisma Client
3. Run database migrations
4. Build the application

### 5. Running with PM2
Use PM2 to manage the Node.js process and ensure uptime.

### 6. Seed Application Settings
Run the settings seed script to add required configuration.

---

## Scheduled Jobs

The application includes scheduled jobs that run automatically:

| Job | Frequency | Description |
|-----|-----------|-------------|
| Order Preparation Check | Every minute | Notify when orders are ready |
| Vendor Auto-Cancel | Every 5 minutes | Cancel orders vendors didn't accept |
| Wallet Auto-Release | Every hour | Release held funds past timeout |

---

## Post-Deployment Verification

| Check | Description |
|-------|-------------|
| Logs | Check PM2 logs for errors |
| API Health | Verify API responds correctly |
| Swagger Docs | Access `/api` for API documentation |
| Scheduled Jobs | Verify cron jobs are running |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Database Connection | Ensure server IP is whitelisted |
| Redis Connection | Check Redis binding configuration |
| Prisma Schema | Run `prisma generate` after schema changes |
| Scheduled Jobs | Verify ScheduleModule is imported |

---

## Containerized Deployment (Recommended)

For isolated and reproducible deployments, use Docker with docker-compose to run the application, database, and Redis together.

---

**Last Updated**: 2026-01-09
