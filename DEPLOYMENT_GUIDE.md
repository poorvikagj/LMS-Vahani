# LMS Vahani - Deployment Guide

## Part 1: Database Setup (Supabase - Free Tier)

### Step 1: Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with email or GitHub
4. Create a new organization and project
5. Choose region closest to your location
6. Save your password securely

### Step 2: Get Database Credentials
1. Go to Project Settings → Database
2. Copy the connection string (PostgreSQL)
3. Connection URL format: `postgresql://[user]:[password]@[host]:[port]/[database]`
4. Note: Change `[user]:[password]@` to your credentials

### Step 3: Migrate Database Schema
1. Go to SQL Editor in Supabase dashboard
2. Create a new query
3. Copy entire content from `/backend/db/schema.sql`
4. Paste into the SQL editor and run
5. Verify all tables are created

### Step 4: Update Environment Variables
In `backend/.env`:
```
DB_USER=postgres
DB_HOST=your-supabase-host.supabase.co
DB_NAME=postgres
DB_PASSWORD=your-supabase-password
DB_PORT=5432
```

---

## Part 2: Backend Deployment (Render.com - Free Tier)

### Step 1: Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy Node.js Backend
1. Click "New ➜ Web Service"
2. Connect your GitHub repository
3. Fill in details:
   - **Name:** vahani-lms-backend
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Region:** Singapore (closest to India)

### Step 3: Add Environment Variables
In Render dashboard → Environment:
```
NODE_ENV=production
DB_USER=postgres
DB_HOST=your-supabase-host.supabase.co
DB_NAME=postgres
DB_PASSWORD=your-supabase-password
DB_PORT=5432
CLOUD_NAME=your-cloudinary-name
CLOUD_API_KEY=your-cloudinary-api-key
CLOUD_API_SECRET=your-cloudinary-api-secret
CLIENT_URL_LOCAL=https://your-frontend-vercel-url.vercel.app
CLIENT_URL_TUNNEL=https://your-frontend-vercel-url.vercel.app
```

### Step 4: Deploy
- Click "Create Web Service"
- Render will automatically deploy from your GitHub repo
- Get your backend URL: `https://vahani-lms-backend.onrender.com`

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Import Project
1. Click "Import Project"
2. Select your GitHub repository
3. Fill in details:
   - **Project Name:** vahani-lms-frontend
   - **Framework Preset:** Vite
   - **Root Directory:** frontend

### Step 3: Add Environment Variables
In Vercel → Settings → Environment Variables:
```
VITE_API_URL=https://vahani-lms-backend.onrender.com
```

### Step 4: Deploy
- Click "Deploy"
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
