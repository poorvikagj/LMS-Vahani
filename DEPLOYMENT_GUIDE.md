# LMS Vahani - Deployment Guide

Complete step-by-step guide to deploy LMS Vahani using Supabase for database and Vercel for frontend.

---

## Table of Contents
1. [Part 1: Supabase Database Setup](#part-1-supabase-database-setup)
2. [Part 2: Backend Deployment on Render](#part-2-backend-deployment-on-render)
3. [Part 3: Frontend Deployment on Vercel](#part-3-frontend-deployment-on-vercel)
4. [Part 4: Post-Deployment Configuration](#part-4-post-deployment-configuration)

---

## Part 1: Supabase Database Setup

Supabase is an open-source Firebase alternative built on PostgreSQL. It provides a managed PostgreSQL database with a beautiful dashboard.

### Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new organization (or use existing)
5. Note: Supabase offers free tier with generous limits

### Step 2: Create a New Project
1. Click "Create a new project"
2. Fill in project details:
   - **Project Name:** vahani-lms (or any name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to your location (e.g., Asia Pacific - Singapore)
3. Click "Create new project"
4. Wait for setup to complete (2-5 minutes)

### Step 3: Get Database Credentials
1. Go to **Project Settings** (bottom left gear icon)
2. Click **Database** tab
3. You'll see the connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
   ```
4. Note down:
   - **Host:** `db.[PROJECT_ID].supabase.co`
   - **Port:** `5432`
   - **Database:** `postgres`
   - **User:** `postgres`
   - **Password:** The password you created

### Step 4: Create Database Tables
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **New query**
3. Open your local file `/backend/db/schema.sql`
4. Copy all contents and paste into Supabase SQL Editor
5. Click **Run** (green play button)
6. Wait for execution to complete
7. Verify tables created by going to **Table editor** tab - you should see all your tables

### Step 5: Update Environment Variables
Update `backend/.env` with your Supabase credentials:
```env
PORT=5000

# Database Connection (from Supabase Project Settings)
DB_USER=postgres
DB_HOST=db.YOUR_PROJECT_ID.supabase.co
DB_NAME=postgres
DB_PASSWORD=YOUR_STRONG_PASSWORD
DB_PORT=5432

JWT_SECRET=mysecretkey
CLIENT_URL_LOCAL=http://localhost:3000
NODE_ENV=development

# Cloudinary (for file uploads)
CLOUD_NAME=your-cloudinary-name
CLOUD_API_KEY=your-api-key
CLOUD_API_SECRET=your-api-secret
```

### Step 6: Test Local Connection
Test if everything works locally:
```bash
cd backend
npm install
npm start
```
You should see: `Server running on port 5000` and `PostgreSQL Connected`

---

## Part 2: Backend Deployment on Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. Ensure your `backend/package.json` has proper scripts:
   ```json
   {
     "scripts": {
       "start": "node server.js",
       "dev": "node server.js"
     }
   }
   ```

3. Verify `backend/server.js` listens on `process.env.PORT`:
   ```javascript
   app.listen(process.env.PORT || 5000, () => {
     console.log(`Server running on port ${process.env.PORT || 5000}`)
   })
   ```

### Step 2: Deploy Backend to Render
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub and authorize
3. Click "New" → "Web Service"
4. Select "Build and deploy from a Git repository"
5. Click "Connect" on your GitHub repository
6. Authorize Render if needed

### Step 3: Configure Backend Service
1. Fill in the deployment details:
   - **Name:** `vahani-lms-backend` (or any name)
   - **Environment:** Node
   - **Region:** Singapore (closest to India) or your preferred region
   - **Branch:** main
   - **Build Command:** `cd backend && npm install`
   - **Start Command:** `npm start`
   - **Root Directory:** Leave empty (build command handles it)

2. Click "Create Web Service"

### Step 4: Add Environment Variables
1. After creating service, you'll see the dashboard
2. Go to **Environment** section
3. Click **Add Environment Variable** and add:

```
NODE_ENV=production
PORT=5000

# Supabase Database
DB_USER=postgres
DB_HOST=db.YOUR_PROJECT_ID.supabase.co
DB_NAME=postgres
DB_PASSWORD=YOUR_SUPABASE_PASSWORD
DB_PORT=5432

# JWT Secret
JWT_SECRET=your-secure-jwt-secret-key-change-this

# Cloudinary (for file uploads)
CLOUD_NAME=your-cloudinary-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret

# Frontend URLs
CLIENT_URL_LOCAL=https://your-frontend-domain.vercel.app
CLIENT_URL_TUNNEL=https://your-frontend-domain.vercel.app
```

4. Click "Add" for each variable

### Step 5: Monitor Deployment
1. Click on your service to go to dashboard
2. Scroll down to **Logs** section
3. Wait for deployment to complete (usually 5-10 minutes)
4. Look for messages like:
   ```
   Server running on port 5000
   PostgreSQL Connected
   ```
5. Get your backend URL from the top of the dashboard:
   - Format: `https://vahani-lms-backend.onrender.com`

### Step 6: Test Backend
```bash
# Test if backend is running
curl https://your-backend-domain/api/health
# You may get 404 if no /api/health route, but at least you know it's running
```

---

## Part 3: Frontend Deployment on Vercel

### Step 1: Prepare Frontend for Production
1. Ensure `frontend/src/services/api.js` uses environment variable:
   ```javascript
   const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
   export const api = axios.create({
     baseURL: API_URL
   })
   ```

2. Push code to GitHub:
   ```bash
   git push origin main
   ```

### Step 2: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up"
3. Sign up with GitHub
4. Authorize Vercel to access your GitHub account

### Step 3: Deploy Frontend
1. In Vercel dashboard, click "Add New..." → "Project"
2. Select "Import Git Repository"
3. Choose your GitHub repository
4. Click "Import"

### Step 4: Configure Project Settings
1. **Framework Preset:** Select "Vite"
2. **Root Directory:** Click "Edit" and set to `frontend`
3. **Build Command:** Should auto-detect as `npm run build`
4. **Output Directory:** Should auto-detect as `dist`

### Step 5: Add Environment Variables
1. Click "Continue to Environment Variables"
2. Add the following:
   ```
   VITE_API_URL=https://your-backend-domain.up.railway.app
   ```
   (Use the backend domain from Railway)

3. Click "Deploy"

### Step 6: Monitor Deployment
1. Vercel will build and deploy automatically
2. Wait for status to show "Ready" (usually 2-3 minutes)
3. Your frontend will be available at a `.vercel.app` domain
4. Save this URL for future reference

---

## Part 4: Post-Deployment Configuration

### Step 1: Connect Frontend to Backend
1. Get your Render backend URL (e.g., `https://vahani-lms-backend.onrender.app`)
2. Go to Vercel project → Settings → Environment Variables
3. Update `VITE_API_URL` with your Render backend domain
4. Redeploy by clicking "Redeploy" or making a new git commit

### Step 2: Verify All Services Working
1. **Test Frontend:** Open your Vercel domain in browser
2. **Test Database Connection:** 
   - In Supabase dashboard, go to Table editor
   - You should see your tables and data
3. **Test API:** Try logging in to the LMS
4. **Check Uploads:** Try uploading a file/image to verify Cloudinary works

### Step 3: Enable Auto-Deploys
1. **Render Backend:** Auto-deploys on push to main branch (default)
2. **Vercel Frontend:** Auto-deploys on push to main branch (default)
3. Verify by making a small commit and checking deployment status

### Step 4: Set Up Monitoring
1. **Render:** Go to service dashboard → Logs to monitor backend
2. **Vercel:** Go to project → Deployments to check build status
3. **Supabase:** Monitor usage in dashboard → Project Settings
4. **Optional:** Set up email alerts in both platforms

### Step 5: Custom Domain Setup (Optional)
**For Render Backend:**
1. Go to Backend Service → Settings (tab at top)
2. Scroll to **Domains**
3. Click "Add Custom Domain"
4. Enter your domain (e.g., `api.yourdomain.com`)
5. Add CNAME record pointing to: `api.yourdomain.com.onrender.com`

**For Vercel Frontend:**
1. Go to Project Settings → Domains
2. Click "Add" and enter your domain
3. Add CNAME record pointing to Vercel (instructions provided)

---

## Troubleshooting

### Backend Not Starting
1. Check Logs: Render Dashboard → Backend Service → Logs tab
2. Common issues:
   - Missing environment variables (DB_HOST, DB_PASSWORD, etc.)
   - Node.js version incompatibility (check package.json)
   - Connection timeout to Supabase database

### Frontend Can't Connect to Backend
1. Check `VITE_API_URL` environment variable in Vercel
2. Verify backend domain is correct and accessible
3. Check CORS settings in `backend/server.js`
4. Browser console → Network tab to see exact error

### Database Connection Errors
1. Verify Supabase database credentials in Render environment variables:
   - `DB_HOST` should be `db.[PROJECT_ID].supabase.co`
   - `DB_PASSWORD` should be your Supabase password
   - `DB_USER` should be `postgres`
2. Test local connection first: `psql postgresql://postgres:PASSWORD@db.PROJECT_ID.supabase.co:5432/postgres`
3. Ensure schema tables were created in Supabase SQL Editor
4. Check if your IP is not blocked by firewall (Supabase free tier allows all IPs)

### Seeing Old Code After Deploy
1. Vercel/Railway: Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Deployment Status in dashboard

---

## Environment Variables Reference

| Variable | Where to Set | Example Value |
|----------|-------------|---------------|
| `DB_HOST` | Render > Environment Variables | `db.abc123xyz.supabase.co` |
| `DB_PASSWORD` | Render > Environment Variables | Your Supabase password |
| `DB_USER` | Render > Environment Variables | `postgres` |
| `DB_NAME` | Render > Environment Variables | `postgres` |
| `DB_PORT` | Render > Environment Variables | `5432` |
| `NODE_ENV` | Render > Environment Variables | `production` |
| `JWT_SECRET` | Render > Environment Variables | `your-secure-secret-key` |
| `VITE_API_URL` | Vercel > Environment Variables | `https://your-backend-domain.onrender.com` |
| `CLOUD_NAME` | Render > Environment Variables | `your-cloudinary-name` |
| `CLOUD_API_KEY` | Render > Environment Variables | `your-cloudinary-api-key` |
| `CLOUD_API_SECRET` | Render > Environment Variables | `your-cloudinary-api-secret` |

---

## Quick Reference: Deployment URLs

After deployment, you'll have:

| Component | URL Format | Example |
|-----------|-----------|---------|
| Backend API | `https://servicename.onrender.com` | `https://vahani-lms-backend.onrender.com` |
| Frontend | `https://projectname.vercel.app` | `https://vahani-lms.vercel.app` |
| Database | Managed by Supabase | `db.PROJECT_ID.supabase.co` |

## Next Steps

1. ✅ Set up monitoring and alerts
2. ✅ Configure custom domains (if needed)
3. ✅ Set up automated backups for database
4. ✅ Monitor logs regularly
5. ✅ Plan scaling strategy as users grow
- Vercel will build and deploy automatically
- Get your frontend URL: `https://vahani-lms-frontend.vercel.app`

---

## Part 4: Update Backend with Frontend URL

After frontend is deployed:

1. Go back to Render dashboard
2. Update environment variables with actual frontend URL:
```
CLIENT_URL_LOCAL=https://your-actual-vercel-url.vercel.app
CLIENT_URL_TUNNEL=https://your-actual-vercel-url.vercel.app
```
3. Redeploy backend

---

## Part 5: Update Database Connection in Backend

### Update `/backend/db/db.js`:
```javascript
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } // Important for Supabase
});
```

---

## Testing Deployment

1. **Test Backend:** 
   - Visit `https://vahani-lms-backend.onrender.com/`
   - Should see: "Backend is running and tunnel is active!"

2. **Test Frontend:**
   - Visit `https://your-frontend.vercel.app`
   - Try logging in with test credentials

3. **Check API Connection:**
   - Open browser DevTools → Network tab
   - Try any action (login, view assignments)
   - Verify API calls are going to Render backend

---

## Free Tier Limitations

| Service | Limit | Details |
|---------|-------|---------|
| Supabase | Unlimited | 500 MB storage free, 2GB egress/month |
| Render | 750 hours/month | Free tier spins down after 15 min inactivity |
| Vercel | Unlimited | 100 GB bandwidth/month free |

### Render Spin-Down Issue:
- Free tier services go to sleep after 15 minutes of inactivity
- First request after sleep takes ~30 seconds
- Solution: Upgrade to paid plan or use a cron job to keep alive

---

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED
```
- Check DB_HOST, DB_PASSWORD in environment variables
- Verify Supabase project is running
- Ensure SSL is set to true for Supabase

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
- Update `CLIENT_URL` in backend environment variables
- Restart backend deployment

### Frontend Can't Connect to API
- Verify `VITE_API_URL` in Vercel environment
- Check backend URL is correct
- Ensure backend is deployed and running

---

## Summary of URLs

After deployment, you'll have:
```
Frontend:  https://vahani-lms-frontend.vercel.app
Backend:   https://vahani-lms-backend.onrender.com
Database:  your-project.supabase.co
```

Update your Cloudinary settings and test thoroughly!
