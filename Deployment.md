# LMS-Vahani Deployment (Render + Supabase + Vercel)

This guide deploys your monorepo using:

- Backend on Render (from backend)
- Database on Supabase Postgres
- Frontend on Vercel (from frontend)

## 1. Prerequisites

Before deployment, prepare:

1. A Render account linked to your GitHub repository.
2. A Supabase project.
3. A Vercel account linked to your GitHub repository.
4. Required secrets:
   - JWT_SECRET
   - DATABASE_URL (Supabase connection string)
   - Cloudinary keys (if upload features are used)
   - OPENAI_API_KEY (if AI features are used)

## 2. Set up Supabase Database

1. Create a project at https://supabase.com.
2. Open SQL Editor.
3. Run backend/db/schema.sql.
4. Copy Supabase Postgres connection string.

## 3. Deploy Backend on Render

Option A (recommended): Blueprint using render.yaml in repo root.

Option B (manual):

1. In Render, click New Web Service.
2. Connect your LMS-Vahani repository.
3. Set Root Directory: backend.
4. Build Command:

   npm install --legacy-peer-deps

5. Start Command:

   npm run start

6. Add environment variables:

- NODE_ENV=production
- PORT=5000
- DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
- JWT_SECRET=your_strong_secret
- DEFAULT_ADMIN_EMAIL=admin@lms.com
- DEFAULT_ADMIN_PASSWORD=strong_admin_password
- DEFAULT_ADMIN_USERNAME=admin
- CLIENT_URL_PROD=https://your-frontend-domain.vercel.app
- CLIENT_URL=https://your-frontend-domain.vercel.app
- CLIENT_URL_LOCAL=http://localhost:3000
- CLIENT_URL_TUNNEL=http://localhost:3000
- OPENAI_API_KEY=...
- OPENAI_MODEL=gpt-4o-mini
- CLOUD_NAME=...
- CLOUD_API_KEY=...
- CLOUD_API_SECRET=...

7. Deploy backend.
8. Verify backend URL, for example:

   https://your-backend.onrender.com/

Expected response:

- Backend is running and tunnel is active!

## 4. Deploy Frontend on Vercel

1. In Vercel, create a new project from the same repository.
2. Set Root Directory: frontend.
3. Framework: Vite.
4. Build Command: npm run build.
5. Output Directory: dist.
6. Add environment variable:

- VITE_API_URL=https://your-backend.onrender.com

7. Deploy frontend.

Note:
- frontend/vercel.json already handles SPA rewrites.

## 5. CORS Setup (Keep as-is in Code)

No code change is needed for CORS behavior. The backend already allows requests from:

- CLIENT_URL_PROD
- CLIENT_URL
- CLIENT_URL_LOCAL
- CLIENT_URL_TUNNEL
- localhost origins

To avoid CORS errors in production:

1. Set CLIENT_URL_PROD and CLIENT_URL to the exact Vercel frontend URL.
2. Redeploy backend after env updates.

## 6. Verification Checklist

After deployment:

1. Open frontend URL and log in.
2. Open backend root URL and confirm health response.
3. Test auth, students, programs, assignments, analytics pages.
4. Test upload features if Cloudinary vars are set.
5. Test AI features if OPENAI_API_KEY is set.

## 7. Common Issues

### Frontend cannot call backend

- Check VITE_API_URL in Vercel settings.
- Ensure it is backend base URL without /api.
- Redeploy frontend after env changes.

### Backend fails on startup

- Check Render logs for missing env vars.
- Verify DATABASE_URL is valid and reachable.
- Ensure schema.sql is applied in Supabase.

### CORS blocked

- Verify CLIENT_URL_PROD and CLIENT_URL match frontend URL exactly.
- Redeploy backend after changing env vars.

### Upload errors

- Verify CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET in Render.
