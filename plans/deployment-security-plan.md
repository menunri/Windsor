# Windsor Deployment Security Plan

## Overview

Deploy Windsor to Vercel (frontend) + Render (backend) with layered security for admin panel protection against unauthorized tenant access.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Frontend)                        │
│  https://windsor-app.vercel.app/  → Public Tenant Site      │
│  https://windsor-app.vercel.app/admin → Protected Admin     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Render (Backend API)                     │
│  https://windsor-api.onrender.com/api                       │
│                                                             │
│  Security Layers:                                           │
│  1. Helmet (Security Headers)                               │
│  2. CORS (Origin Lockdown)                                 │
│  3. Rate Limiting (Brute Force Protection)                 │
│  4. Basic Auth Gate (Admin Routes)                          │
│  5. JWT Authentication (Existing)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase (Database)                     │
│  - admin_users table                                       │
│  - refresh_tokens table                                    │
└─────────────────────────────────────────────────────────────┘
```

## Security Layers (Defense in Depth)

### Layer 1: Security Headers (Helmet)

- XSS Protection
- Content Security Policy
- HSTS (HTTP Strict Transport Security)
- Frame Options (Clickjacking Protection)

### Layer 2: CORS Origin Lockdown

- Only allow requests from your Vercel frontend domain
- Block all other origins

### Layer 3: Rate Limiting

- Login endpoint: 5 requests per minute per IP
- General API: 100 requests per minute per IP

### Layer 4: Basic Auth Gate (Admin Routes)

- HTTP Basic Authentication before admin routes
- Separate from JWT auth
- Acts as obfuscation layer

### Layer 5: JWT Authentication (Existing)

- Already implemented
- Access + Refresh token flow
- bcrypt password hashing

---

## Implementation Steps

### Phase 1: Server Security Middleware

#### 1.1 Install Dependencies

```bash
cd server
npm install helmet cors express-rate-limit
```

#### 1.2 Create Security Middleware

File: `server/src/middleware/security.js`

```javascript
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Security headers
export const securityHeaders = helmet();

// CORS - restrict to Vercel frontend only
export const corsOptions = {
  origin: process.env.CLIENT_URL || "https://windsor-app.vercel.app",
  credentials: true,
};

// Rate limiter for login endpoint
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  message: { error: "Too many login attempts. Try again after a minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for general API
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please slow down." },
});
```

#### 1.3 Create Basic Auth Middleware

File: `server/src/middleware/basicAuth.js`

```javascript
// Basic Auth for admin routes - obfuscation layer
// Not a replacement for JWT auth, just adds complexity for attackers

const ADMIN_BASIC_USER = process.env.ADMIN_BASIC_USER || "windsor_admin";
const ADMIN_BASIC_PASS = process.env.ADMIN_BASIC_PASS; // REQUIRED in production

export function requireBasicAuth(req, res, next) {
  // Skip if credentials not configured
  if (!ADMIN_BASIC_PASS) {
    console.warn("WARNING: ADMIN_BASIC_PASS not set - Basic Auth disabled");
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    res.setHeader("WWW-Authenticate", 'Basic realm="Windsor Admin"');
    return res.status(401).json({ error: "Authentication required" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf8");
  const [username, password] = credentials.split(":");

  if (username === ADMIN_BASIC_USER && password === ADMIN_BASIC_PASS) {
    return next();
  }

  return res.status(401).json({ error: "Invalid credentials" });
}
```

#### 1.4 Update Server Entry Point

File: `server/src/index.js`

Add imports and apply middleware to admin routes:

```javascript
import {
  securityHeaders,
  corsOptions,
  loginLimiter,
  apiLimiter,
} from "./middleware/security.js";
import { requireBasicAuth } from "./middleware/basicAuth.js";

// Apply security headers globally
app.use(securityHeaders);

// Apply CORS
app.use(cors(corsOptions));

// Apply rate limiter to all routes
app.use("/api", apiLimiter);

// Apply Basic Auth to admin routes
app.use("/api/admin", requireBasicAuth);

// Apply stricter rate limiting to login
app.use("/api/admin/auth/login", loginLimiter);
```

### Phase 2: Environment Variables

#### 2.1 Server (.env)

```
# Security - REQUIRED for production
ADMIN_BASIC_USER=windsor_admin
ADMIN_BASIC_PASS=<generate_strong_random_password>

# Existing vars
PORT=3000
NODE_ENV=production
SUPABASE_URL=your_supabase_url
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_db_password
SUPABASE_DB_NAME=postgres
JWT_SECRET=<your_strong_jwt_secret_at_least_32_chars>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
CLIENT_URL=https://windsor-app.vercel.app
```

**Generate strong credentials:**

- ADMIN_BASIC_PASS: Use `openssl rand -base64 32` or a password manager
- JWT_SECRET: Use `openssl rand -base64 64`

#### 2.2 Client (.env)

```
VITE_API_URL=https://windsor-api.onrender.com/api
```

### Phase 3: Add Failed Login Tracking (Optional Enhancement)

#### 3.1 Add Migration

File: `server/migrations/003_admin_security.sql`

```sql
-- Add failed login tracking to admin_users
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP NULL,
ADD COLUMN IF NOT EXISTS last_login_attempt TIMESTAMP NULL;
```

#### 3.2 Update adminAuth Route

In `server/src/routes/adminAuth.js`, update the login endpoint to check lockout status.

---

## Deployment Steps

### Step 1: Prepare Code Changes

1. Apply all security middleware changes to `server/src/index.js`
2. Create new middleware files
3. Update `.env.example` with new required variables

### Step 2: Set Up Supabase Migration

1. Go to Supabase SQL Editor
2. Run `server/migrations/001_initial_schema.sql`
3. Run `server/migrations/002_inquiry_schema.sql`
4. Run `server/migrations/003_admin_security.sql`

### Step 3: Create Admin User (Manual)

```bash
# Use Supabase Dashboard > SQL Editor
INSERT INTO admin_users (email, password_hash, name, is_active)
VALUES (
  'admin@yourdomain.com',
  -- bcrypt hash of your strong password
  '$2a$10$...',
  'Your Name',
  true
);
```

**Generate password hash via bcrypt:**

```javascript
const bcrypt = require("bcryptjs");
const hash = bcrypt.hashSync("your_strong_admin_password", 10);
console.log(hash);
```

### Step 4: Deploy Backend to Render

1. Create account at [render.com](https://render.com)
2. Connect your GitHub repo
3. Create Web Service:
   - **Name:** windsor-api
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. Add Environment Variables (from Step 2):
   - `ADMIN_BASIC_USER`
   - `ADMIN_BASIC_PASS` (generate strong password)
   - `JWT_SECRET` (generate strong secret)
   - `SUPABASE_URL`
   - `SUPABASE_DB_*` (all Supabase credentials)
   - `CLIENT_URL` (your Vercel frontend URL)
   - `NODE_ENV=production`

### Step 5: Deploy Frontend to Vercel

1. Create account at [vercel.com](https://vercel.com)
2. Import your GitHub repo
3. Configure:
   - **Framework:** Vite
   - **Root Directory:** `./client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

4. Add Environment Variable:
   - `VITE_API_URL` = `https://windsor-api.onrender.com/api`

5. Deploy

### Step 6: Verify Deployment

#### Test Public Routes (should work without Basic Auth)

```bash
curl https://windsor-api.onrender.com/api/rooms
# Should return 200 with rooms data
```

#### Test Admin Routes (should require Basic Auth)

```bash
curl https://windsor-api.onrender.com/api/admin/auth/me
# Should return 401 with "Authentication required"

curl -u windsor_admin:<BASIC_PASS> https://windsor-api.onrender.com/api/admin/auth/me
# Should return 401 with "No token provided" (still need JWT)
```

#### Test Login with Rate Limiting

```bash
# Try 6 login attempts quickly
curl -X POST https://windsor-api.onrender.com/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -u windsor_admin:<BASIC_PASS> \
  -d '{"email":"admin@test.com","password":"wrong"}'
# 6th attempt should return 429 "Too many login attempts"
```

---

## Access Flow for Admin

### When you want to access admin panel:

1. Go to `https://windsor-app.vercel.app/admin`
2. Browser prompts for Basic Auth credentials (popup)
   - Username: `windsor_admin`
   - Password: `<ADMIN_BASIC_PASS>`
3. You reach the admin login page
4. Enter your JWT admin credentials (email + password)
5. Access granted to admin dashboard

### What tenants see:

1. Go to `https://windsor-app.vercel.app/`
2. Normal browsing works (rooms, search, etc.)
3. Try to access `/admin` directly
4. Get Basic Auth popup
5. Without credentials, cannot proceed
6. Even if they guess Basic Auth creds, still need JWT admin login

---

## Security Checklist

- [ ] `ADMIN_BASIC_PASS` set in Render env vars
- [ ] `JWT_SECRET` set (at least 32 characters)
- [ ] CORS restricted to your Vercel domain only
- [ ] Rate limiting enabled on login endpoint
- [ ] Security headers enabled (Helmet)
- [ ] No admin links exposed in public navigation
- [ ] Admin user created in Supabase with strong password
- [ ] Test Basic Auth challenge on `/admin` routes
- [ ] Test rate limiting after 5 failed logins

---

## Troubleshooting

### "Authentication required" even for valid requests

- Check `ADMIN_BASIC_PASS` is set in Render environment variables
- Check the Authorization header format: `Basic <base64>`

### CORS errors after deployment

- Verify `CLIENT_URL` in Render matches exactly your Vercel URL (including https://)
- No trailing slash

### Rate limiting too aggressive during development

- Adjust `max` value in `loginLimiter` for development
- Or use `NODE_ENV` check to disable in dev

---

## File Changes Summary

| File                                       | Action                                             |
| ------------------------------------------ | -------------------------------------------------- |
| `server/src/middleware/security.js`        | Create new                                         |
| `server/src/middleware/basicAuth.js`       | Create new                                         |
| `server/src/index.js`                      | Update - add security imports and middleware       |
| `server/package.json`                      | Add dependencies: helmet, cors, express-rate-limit |
| `server/.env.example`                      | Add new variables                                  |
| `server/migrations/003_admin_security.sql` | Create (optional)                                  |
| `plans/deployment-security-plan.md`        | This file                                          |
