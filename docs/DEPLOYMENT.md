# CitizenLex Production Deployment Guide

This guide walks through deploying CitizenLex to production using the recommended stack: **Render** (backend + database) and **Vercel** (frontend).

---

## 🔗 Live Production URLs

| Service | URL |
|---------|-----|
| **Frontend (Vercel)** | https://ai-powered-citizen-lex.vercel.app |
| **Backend (Render)** | https://citizenlex-backend.onrender.com |
| **API Health Check** | https://citizenlex-backend.onrender.com/ |
| **Swagger UI** | https://citizenlex-backend.onrender.com/swagger-ui/index.html |

---

## Architecture Overview

```
GitHub Push
    │
    ├── GitHub Actions CI (Java build + test)
    │
    ├── Railway: Auto-redeploy Spring Boot backend
    │
    └── Vercel: Auto-redeploy React frontend
                │
Internet → Vercel Edge → React SPA → Railway API → Railway MySQL
                                   ↘ Gemini AI, Cloudinary
```

---

## Prerequisites

- [ ] Railway account: https://railway.app
- [ ] Vercel account: https://vercel.com
- [ ] Google Cloud Console project with Maps JS API + Geocoding API enabled
- [ ] Google AI Studio API key (Gemini): https://makersuite.google.com
- [ ] Cloudinary account: https://cloudinary.com (required for profile photo uploads)
- [ ] Gmail account with App Password enabled (optional, for email verification)

---

## Step 1: Deploy MySQL on Railway

1. Log into [railway.app](https://railway.app)
2. Click **New Project → Database → MySQL**
3. Railway provisions MySQL 8 and generates connection variables
4. Note the `MYSQL_URL` — parse it into `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

---

## Step 2: Deploy Backend on Railway

1. In your Railway project, click **New Service → GitHub Repo**
2. Select `Ai-powered-CitizenLex`
3. Set **Root Directory** to `backend`
4. Railway auto-detects Maven and builds the JAR

### Required Environment Variables (Railway Dashboard → Variables)

```
DB_HOST=<railway_mysql_host>
DB_PORT=<railway_mysql_port>
DB_NAME=railway
DB_USER=<railway_mysql_user>
DB_PASSWORD=<railway_mysql_password>
GEMINI_API_KEY=<your_gemini_key>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud>
CLOUDINARY_API_KEY=<your_cloudinary_key>
CLOUDINARY_API_SECRET=<your_cloudinary_secret>
SPRING_MAIL_USERNAME=<gmail_address>
SPRING_MAIL_PASSWORD=<gmail_app_password>
PORT=8080
```

5. Railway builds and deploys — your backend URL will be:
   `https://<project-name>.up.railway.app`

---

## Step 3: Deploy Frontend on Vercel

### Option A: Using Vercel CLI (recommended for CLI-driven setup)

```bash
cd frontend
npx vercel --prod
```

### Option B: GitHub Auto-Deploy Integration

The project is configured for automatic Vercel deployment on every push to `main`:

1. Log into [vercel.com](https://vercel.com)
2. Click **Add New → Project → Import from GitHub**
3. Select `Ai-powered-CitizenLex`
4. Set **Root Directory** to `.` (project root — the repo root)
5. Set **Build Command** to `npm run build --prefix frontend`
6. Set **Install Command** to `npm install --prefix frontend`
7. Set **Output Directory** to `frontend/dist`

### Optional Environment Variables (Vercel Dashboard → Settings → Environment)

```
VITE_API_URL=              (leave empty — API calls go through Vercel's /api rewrites)
VITE_GOOGLE_MAPS_API_KEY=<your_maps_key>
```

> **Note:** `VITE_API_URL` should be empty (`''`) in production because `vercel.json` already proxies `/api/*` requests to the Railway backend. No API URL needs to be hardcoded in the frontend bundle.

8. Click **Deploy** — the app goes live at `https://ai-powered-citizen-lex.vercel.app`

---

## Step 4: Verify the Vercel Proxy is Configured

The file `vercel.json` at the project root contains the API proxy and SPA routing:

```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://citizenlex-backend.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This ensures:
- All `/api/*` requests are proxied to the Render backend
- All other routes serve `index.html` (React SPA client-side routing)

---

## Step 5: Cloudinary Configuration (Profile Photo Uploads)

Profile photos are stored on Cloudinary. The backend detects `CLOUDINARY_*` environment variables at startup:

- If all 3 are set and not `"mock"` → uploads go directly to Cloudinary ✅
- If any is missing or `"mock"` AND running in production → throws an error ❌
- If any is missing or `"mock"` AND running locally → saves to local `/uploads/` directory (dev only)

**Startup log (production):**
```
CloudinaryService initialized. Mock mode: false, Production mode: true
```

---

## Step 6: Verify Deployment

```bash
# Check backend health
curl https://citizenlex-backend.onrender.com/

# Check lawyers seeded
curl https://citizenlex-backend.onrender.com/api/lawyers?page=0&size=3

# Check frontend loads
open https://ai-powered-citizen-lex.vercel.app
```

---

## Self-Hosted: Docker Compose

```bash
git clone https://github.com/Abishekvsb/Ai-powered-CitizenLex.git
cd Ai-powered-CitizenLex
cp .env.example .env   # Fill in your keys
docker compose up -d --build

# Check logs
docker compose logs -f backend
docker compose logs -f frontend
```

**Services:**
- Frontend: http://localhost (port 80)
- Backend: http://localhost:8080
- MySQL: localhost:3306

---

## CI/CD Pipeline

Every push to `main` triggers the full pipeline automatically:

```
git push origin main
    │
    ├── 1. GitHub Actions: Java CI + CodeQL Security Analysis
    ├── 2. Railway: Automatic backend redeploy (GitHub webhook)
    └── 3. Vercel: Automatic frontend redeploy (GitHub webhook)
```

No manual deployment steps required after initial setup.

### GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `Java CI/CD — Build, Test & Package` | Push to `main`/`develop` | Compiles Spring Boot, packages JAR |
| `CodeQL Security Analysis` | Push to `main`/`develop` | Static security analysis |

---

## Monitoring & Logs

### Railway Logs
```bash
railway logs
railway status
```

### Vercel Deployments
```bash
npx vercel ls
npx vercel logs <deployment-url>
```

### Database Backup
```bash
# Connect via Railway CLI
railway connect

# Dump database
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD railway > backup.sql
```

---

## Updating Production

```bash
# Any push to main auto-redeploys everywhere
git add .
git commit -m "your change"
git push origin main
```

GitHub Actions CI checks run first. If CI passes, Railway and Vercel both redeploy automatically.
