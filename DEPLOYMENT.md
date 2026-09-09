# NorthCRM Deployment & Publishing Manual

This document provides a step-by-step guide to publishing **NorthCRM** to GitHub, deploying the application to production using **100% free cloud resources**, and enabling **GitHub Pages** for project documentation.

---

## 📍 Repository Information
- **GitHub Repository**: [mnishantlabs/NorthCRM](https://github.com/mnishantlabs/NorthCRM)
- **Documentation**: [https://mnishantlabs.github.io/NorthCRM/](https://mnishantlabs.github.io/NorthCRM/)

---

## 🛠️ Step 1: Publishing Code to GitHub

If you are setting up the repository for the first time, run the following git commands in your local project terminal:

```bash
# 1. Initialize git in the root folder
git init

# 2. Stage all project files
git add .

# 3. Create your initial commit
git commit -m "feat: initial commit of NorthCRM"

# 4. Set the default branch to main
git branch -M main

# 5. Add remote GitHub repository
git remote add origin https://github.com/mnishantlabs/NorthCRM.git

# 6. Push to GitHub
git push -u origin main
```

---

## 🗄️ Step 2: Setting Up Free PostgreSQL Database (Supabase)

NorthCRM requires a PostgreSQL database. You can host one for free on Supabase:

1. Sign up or log in at [Supabase.com](https://supabase.com).
2. Click **New Project** → Enter project name `NorthCRM` → Set a database password.
3. Once created, go to **Project Settings** → **Database**.
4. Scroll down to **Connection String** → Select **URI**.
5. Copy the connection string. It will look like:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxx.supabase.co:5432/postgres`

---

## 🚀 Step 3: Deploying FastAPI Backend (Render)

Host your backend Python server on Render's free Web Service tier:

1. Log into [Render.com](https://render.com).
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository `mnishantlabs/NorthCRM`.
4. Configure the settings:
   - **Name**: `northcrm-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Under **Environment Variables**, set:
   - `DATABASE_URL`: *(Your Supabase connection string from Step 2)*
   - `JWT_SECRET_KEY`: *(Any 32+ character random secret string)*
   - `ENVIRONMENT`: `production`
6. Click **Create Web Service**. Render will build and host your backend API. Note your service URL (e.g. `https://northcrm-backend.onrender.com`).

---

## 💻 Step 4: Deploying React Frontend (Vercel)

Host your frontend client on Vercel's free tier:

1. Log into [Vercel.com](https://vercel.com).
2. Click **Add New...** → **Project**.
3. Import `mnishantlabs/NorthCRM`.
4. Click **Edit** next to **Root Directory** and select `frontend`.
5. Under **Environment Variables**, add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://northcrm-backend.onrender.com/api/v1` *(Your Render backend URL + `/api/v1`)*
6. Click **Deploy**. Vercel will compile the Vite React app and give you a public URL (e.g. `https://northcrm.vercel.app`).

---

## ⚡ Step 5: Initialize Database & Default Admin

To populate the database tables and seed initial data:

1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click your backend service `northcrm-backend` → Click **Shell** in the menu.
3. Run the following commands:
   ```bash
   alembic upgrade head
   python -m app.seed
   ```
4. Access your live website on Vercel and log in:
   - **Email**: `admin@northcrm.com`
   - **Password**: `Admin@1234`

---

## 📚 Step 6: Enabling GitHub Pages Documentation

NorthCRM includes a pre-configured `docs/` folder for GitHub Pages.

1. Go to your repository settings on GitHub: [`mnishantlabs/NorthCRM/settings`](https://github.com/mnishantlabs/NorthCRM/settings).
2. In the left navigation, click **Pages**.
3. Under **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main`
   - **Folder**: `/docs`
4. Click **Save**.
5. Your documentation site will automatically publish at:
   `https://mnishantlabs.github.io/NorthCRM/`

---

## 📊 Summary of Free Hosting Stack

| Component | Service | Free Tier Allocation | Cost |
|---|---|---|---|
| Repository & Docs | GitHub & GitHub Pages | Unlimited Public/Private repos & Pages site | **$0** |
| Database | Supabase | 500 MB PostgreSQL Cloud DB | **$0** |
| Backend API | Render | Free 512 MB Web Service | **$0** |
| Frontend Web | Vercel | Unlimited static SPA hosting & CDN | **$0** |
