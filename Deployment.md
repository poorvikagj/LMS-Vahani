# LMS-Vahani Deployment on Vercel (Frontend + Backend)

This guide deploys your monorepo as two separate Vercel projects:

- Frontend project from the frontend folder (Vite + React)
- Backend project from the backend folder (Express API as Vercel serverless functions)

## 1. Prerequisites

Before you deploy, make sure you have:

1. A Vercel account linked to your GitHub repository.
2. A PostgreSQL database (Supabase, Neon, Railway, or any managed Postgres).
3. Required secrets ready:
   - JWT_SECRET
   - DATABASE_URL (or DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME)
   - Cloudinary keys (if upload features are used)
   - OPENAI_API_KEY (if AI features are used)

## 2. Prepare Backend for Vercel Serverless

Your backend currently starts with app.listen in backend/server.js. Vercel serverless functions should export the Express app instead of binding to a fixed port.

### Step 2.1 Update backend/server.js

At the bottom of backend/server.js, replace the current startup block:

```js
const PORT = Number(process.env.PORT) || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

with:

```js
const PORT = Number(process.env.PORT) || 5000

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })
}

module.exports = app
```

This keeps local development unchanged while making Vercel deployment compatible.

### Step 2.2 Add backend/vercel.json

Create backend/vercel.json with:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ]
}
```

## 3. Backend Environment Variables on Vercel

In the backend Vercel project settings, add these variables.

### Required

- NODE_ENV=production
- JWT_SECRET=your_strong_secret
- DATABASE_URL=postgresql://user:password@host:5432/dbname

### CORS settings for your frontend URL

- CLIENT_URL_PROD=https://your-frontend-domain.vercel.app
- CLIENT_URL=https://your-frontend-domain.vercel.app

### Optional but recommended for local/testing consistency

- CLIENT_URL_LOCAL=http://localhost:5173
- CLIENT_URL_TUNNEL=http://localhost:5173

### Optional (only if corresponding features are used)

- OPENAI_API_KEY=...
- OPENAI_MODEL=gpt-4o-mini
- CLOUD_NAME=...
- CLOUD_API_KEY=...
- CLOUD_API_SECRET=...
- DEFAULT_ADMIN_EMAIL=admin@lms.com
- DEFAULT_ADMIN_PASSWORD=strong_admin_password
- DEFAULT_ADMIN_USERNAME=admin

Note:

- If you provide DATABASE_URL, the code uses that first.
- If DATABASE_URL is missing, set DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME instead.

## 4. Initialize Database Schema

Run backend/db/schema.sql in your PostgreSQL database before first production login.

You can do this from:

1. Your DB provider SQL editor (simplest), or
2. Local terminal using psql against your production database.

## 5. Deploy Backend on Vercel

1. In Vercel, click Add New Project.
2. Select your LMS-Vahani repository.
3. Set Root Directory to backend.
4. Framework preset: Other.
5. Build command: leave empty.
6. Output directory: leave empty.
7. Add environment variables from Section 3.
8. Deploy.

After deploy, verify backend health by opening:

- https://your-backend-domain.vercel.app/

Expected response:

- Backend is running and tunnel is active!

## 6. Deploy Frontend on Vercel

1. In Vercel, click Add New Project again.
2. Select the same LMS-Vahani repository.
3. Set Root Directory to frontend.
4. Framework preset: Vite.
5. Build command: npm run build.
6. Output directory: dist.
7. Add environment variable:
   - VITE_API_URL=https://your-backend-domain.vercel.app
8. Deploy.

The file frontend/vercel.json already supports SPA rewrites to index.html.

## 7. Update Backend CORS After Frontend URL Is Final

When frontend deployment is complete and you know the final frontend URL:

1. Go to backend Vercel project settings.
2. Update CLIENT_URL_PROD and CLIENT_URL to the exact frontend URL.
3. Redeploy backend.

This avoids CORS errors when frontend calls API routes.

## 8. Production Verification Checklist

After both deployments:

1. Open frontend URL and log in.
2. Confirm API calls succeed in browser network tab.
3. Test admin dashboard data loading.
4. Test student list/program pages.
5. Test assignment upload (if Cloudinary keys are set).
6. Test AI analytics endpoints (if OpenAI key is set).

## 9. Common Issues and Fixes

### 500 errors on backend

- Check Vercel backend logs.
- Most common causes:
  - Missing JWT_SECRET
  - Missing/invalid DATABASE_URL
  - Database schema not initialized

### CORS blocked from frontend

- Verify backend env values CLIENT_URL_PROD and CLIENT_URL exactly match frontend URL.
- Redeploy backend after changing env vars.

### Frontend cannot hit API

- Verify frontend env var VITE_API_URL is set to backend base URL without trailing /api.
- Confirm frontend redeployed after env var changes.

### File upload errors

- Confirm CLOUD_NAME, CLOUD_API_KEY, CLOUD_API_SECRET are set in backend Vercel project.

## 10. Optional: Vercel CLI Deployment

You can also deploy via CLI from each folder:

```bash
cd backend
vercel

cd ../frontend
vercel
```

Use vercel --prod when ready for production.
