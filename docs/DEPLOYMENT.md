# Deployment Guide - Foodie Backend

This guide provides instructions for deploying the Foodie Backend (NestJS + Prisma + PostgreSQL) to a production environment.

---

## Production Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| App Server | Node.js (v20+) | NestJS application (High Availability) |
| Database | PostgreSQL (v16+) | Primary data store with PostGIS extension |
| Cache/Queue | Redis | Session management and background jobs |
| Reverse Proxy | Nginx | SSL termination and load balancing |
| Process Manager | PM2 / Docker | Keeps application alive with zero-downtime |

---

## Security Hardening (Production Standards)

The backend implements **Tier 1 Security** through a multi-layer defense system:

1.  **Mobile Shield Guard**: Every API request is validated against a native `X-API-KEY`.
2.  **Native Integrity Check**: Integrated with the Mobile App's FFI Native Shield.
3.  **Encrypted Transport**: SSL Certificate Pinning (SHA-256) is enforced.
4.  **Payload Protection**: Request/Response compression and HPP (HTTP Parameter Pollution) protection.

---

## Environment Variables

| Variable | Description | Requirement |
|----------|-------------|-------------|
| `PORT` | Server port (managed via SecurityConstants) | Optional |
| `NODE_ENV` | Must be set to `production` | **Critical** |
| `DATABASE_URL` | PostgreSQL connection string | **Critical** |
| `SECURE_API_KEY` | Secret key matching Mobile Native Shield | **Critical** |
| `SESSION_SECRET` | Strong random secret for AdminJS sessions | **Critical** |
| `ALLOWED_ORIGINS` | Comma-separated list of trusted CORS domains | **Critical** |
| `JWT_SECRET` | HS256 / RS256 signing secret | **Critical** |
| `REDIS_HOST` | Redis server host | Required |

---

## Deployment Steps

### 1. Server Preparation
- Install Node.js (v20+), PostgreSQL (v16+), and Redis.
- Install PM2 globally: `npm install -g pm2`.

### 2. Database Migration & Optimization
- Create database and enable PostGIS.
- Run migrations: `npx prisma migrate deploy`.
- Generate client: `npx prisma generate`.

### 3. Build for Production
- Install dependencies: `npm ci --omit=dev`.
- Build TypeScript: `npm run build`.

### 4. Zero-Downtime Launch (PM2)
```bash
pm2 start dist/main.js --name foodie-api -i max --env production
```

### 5. Compression & Performance
The backend automatically compresses responses using `Gzip/Brotli` and manages graceful shutdowns for Prisma and Socket.io.

---

## Rate Limiting (Flood Protection)

| Environment | Limit | TTL |
|-------------|-------|-----|
| **Production** | 60 requests | 1 minute |
| **Development** | 200 requests | 1 second |

---

## Post-Deployment Verification

| Check | Expected Result |
|-------|-----------------|
| API Security | Requests without `X-API-KEY` must return `401 Unauthorized` |
| SSL Pinning | Server certificate must match the pinned SHA-256 in Mobile App |
| Logs Sanity | Sensitive data (passwords/tokens) must be `***REDACTED***` |
| Health Check | `/api/v1/health` (if implemented) returns 200 |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Verify `SECURE_API_KEY` matches between `.env` and App's FFI. |
| CORS Errors | Add the request origin to `ALLOWED_ORIGINS` in `.env`. |
| Memory Leaks | Ensure `NODE_ENV=production` is set to activate production logger. |

---

**Last Updated**: 2026-01-25 (Security Protocol v2.0)
