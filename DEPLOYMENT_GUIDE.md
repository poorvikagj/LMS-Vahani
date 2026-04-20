# LMS Vahani - Deployment Guide

Recommended stack for this repo:
- Frontend: Vercel (Vite React)
- Backend: Render (Express server)
- Database: Supabase (PostgreSQL)

This monorepo is already prepared for this setup.

## 1) Supabase (Database)

1. Create a project at https://supabase.com.
2. Open SQL Editor and run the schema from backend/db/schema.sql.
3. Copy the connection string and keep it for Render as DATABASE_URL.

## 2) Render (Backend)

1. Create a new Web Service in Render from this GitHub repository.
2. Set Root Directory to backend.
3. Set Build Command: npm install --legacy-peer-deps
4. Set Start Command: npm run start
5. Set environment variables in Render:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:your_password@db.your-project.supabase.co:5432/postgres
JWT_SECRET=replace_with_strong_secret
DEFAULT_ADMIN_EMAIL=admin@lms.com
DEFAULT_ADMIN_PASSWORD=replace_with_secure_password
DEFAULT_ADMIN_USERNAME=admin
CLIENT_URL_PROD=https://your-frontend.vercel.app
CLIENT_URL=https://your-frontend.vercel.app
CLIENT_URL_LOCAL=http://localhost:3000
CLIENT_URL_TUNNEL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
CLOUD_NAME=
CLOUD_API_KEY=
CLOUD_API_SECRET=
```

6. Deploy and copy your backend URL, for example:
   https://your-backend.onrender.com

Optional:
- Use render.yaml in repo root for one-click Blueprint setup.

## 3) Vercel (Frontend)

1. Import this GitHub repository into Vercel.
2. Set Root Directory to frontend.
3. Add environment variable:

```
VITE_API_URL=https://your-backend.onrender.com
```

4. Deploy.

Note:
- frontend/vercel.json is included for SPA route rewrites.

## 4) Post-Deploy Verification

1. Open backend URL root:
   https://your-backend.onrender.com/
   You should see a backend running message.

2. Open frontend URL and test:
   - Login
   - Student report page
   - Admin analytics
   - AI chat endpoints

3. If CORS errors appear:
   - Verify CLIENT_URL_PROD and CLIENT_URL in Render exactly match your Vercel URL.
   - Redeploy backend.

## 5) Files Added/Prepared

- frontend/vercel.json
- frontend/.env.example
- backend/.env.example
- backend/server.js supports dynamic PORT and production CORS list
- backend/db/db.js supports DATABASE_URL and Supabase SSL in production
- render.yaml supports Render Blueprint deployment

## 6) Troubleshooting

### Frontend cannot call backend
- Check VITE_API_URL in Vercel project settings.
- Confirm backend URL is reachable in browser.

### Database connection failed
- Check DATABASE_URL value in Render.
- Confirm schema is executed in Supabase.

### Backend deploy fails with missing modules
- Ensure backend/package.json includes required packages.
- Redeploy after dependency update.
