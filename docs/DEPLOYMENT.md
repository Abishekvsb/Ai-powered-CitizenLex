# CitizenLex Production Deployment Guide

This guide walks through deploying CitizenLex to production using the recommended stack: **Railway** (backend + database) and **Vercel** (frontend).

---

## Architecture Overview

```
Internet → Vercel Edge → React SPA → Railway API → Railway MySQL
                                   ↘ Gemini AI, Cloudinary, Razorpay, Google Maps
```

---

## Prerequisites

- [ ] Railway account: https://railway.app
- [ ] Vercel account: https://vercel.com
- [ ] Google Cloud Console project with Maps JS API + Geocoding API enabled
- [ ] Google AI Studio API key (Gemini): https://makersuite.google.com
- [ ] Cloudinary account: https://cloudinary.com
- [ ] Razorpay account (optional for payment testing): https://razorpay.com
- [ ] Gmail account with App Password enabled

---

## Step 1: Deploy MySQL on Railway

1. Log into [railway.app](https://railway.app)
2. Click **New Project → Database → MySQL**
3. Railway provisions MySQL 8 and generates a connection string
4. Note the `MYSQL_URL` — you'll parse it into `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

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
DB_NAME=CitizenLexDB
DB_USER=<railway_mysql_user>
DB_PASSWORD=<railway_mysql_password>
GEMINI_API_KEY=<your_gemini_key>
CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud>
CLOUDINARY_API_KEY=<your_cloudinary_key>
CLOUDINARY_API_SECRET=<your_cloudinary_secret>
SPRING_MAIL_USERNAME=<gmail_address>
SPRING_MAIL_PASSWORD=<gmail_app_password>
GOOGLE_MAPS_API_KEY=<your_maps_key>
RAZORPAY_KEY_ID=<razorpay_key>
RAZORPAY_KEY_SECRET=<razorpay_secret>
PORT=8080
```

5. Railway builds and deploys — grab your public URL: `https://your-backend.railway.app`

---

## Step 3: Deploy Frontend on Vercel

1. Log into [vercel.com](https://vercel.com)
2. Click **Add New → Project → Import from GitHub**
3. Select `Ai-powered-CitizenLex`
4. Set **Root Directory** to `frontend`
5. Set **Build Command** to `npm run build`
6. Set **Output Directory** to `dist`

### Required Environment Variables (Vercel Dashboard → Settings → Environment)

```
VITE_API_URL=https://your-backend.railway.app
VITE_GOOGLE_MAPS_API_KEY=<your_maps_key>
```

7. Click **Deploy** — your app is live at `https://your-app.vercel.app`

---

## Step 4: Configure CORS

In `backend/src/main/resources/application.yml`, ensure the frontend URL is in the CORS allowlist:

```yaml
cors:
  allowed-origins:
    - https://your-app.vercel.app
    - http://localhost:5173
```

Redeploy the backend after updating.

---

## Step 5: Custom Domain (Optional)

**Vercel:**
1. Go to Project → Settings → Domains
2. Add your domain: `citizenlex.yourdomain.com`
3. Configure DNS CNAME as instructed

**Railway:**
1. Go to Service → Settings → Domains
2. Add: `api.citizenlex.yourdomain.com`

---

## Step 6: Verify Deployment

```bash
# Check backend health
curl https://your-backend.railway.app/api/health

# Check database seeder ran (look for 200 response with lawyer data)
curl https://your-backend.railway.app/api/lawyers?district=Chennai

# Check frontend
open https://your-app.vercel.app
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

## Monitoring & Logs

### Railway Logs
```
railway logs --service backend
```

### Vercel Logs
Available in Vercel Dashboard → Project → Functions (real-time streaming).

### Database Backup
```bash
# Connect via Railway CLI
railway connect mysql

# Dump database
mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD CitizenLexDB > backup.sql
```

---

## Updating Production

```bash
# Push to main triggers auto-redeploy on both Railway and Vercel
git push origin main
```

GitHub Actions will run CI checks before merge — all tests must pass.
