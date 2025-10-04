# 🚀 Using Supabase Instead of Local PostgreSQL

## Why Supabase?

- ✅ **No local installation** - works in the cloud
- ✅ **Free tier** - generous limits for development
- ✅ **Built-in GUI** - manage database visually
- ✅ **Instant setup** - ready in 2 minutes
- ✅ **PostgreSQL compatible** - works with our Prisma schema

---

## Step 1: Create Supabase Account (2 minutes)

1. **Go to:** https://supabase.com/
2. **Click:** "Start your project"
3. **Sign in with:** GitHub, Google, or Email
4. **It's FREE!** No credit card required

---

## Step 2: Create a New Project (1 minute)

1. **Click:** "New Project"
2. **Fill in:**
   - **Name:** `econsultation` (or any name you like)
   - **Database Password:** Choose a strong password and SAVE IT
   - **Region:** Choose closest to you (e.g., "South Asia (Mumbai)" or "Southeast Asia (Singapore)")
   - **Pricing Plan:** Free (includes 500MB database, 2GB bandwidth)

3. **Click:** "Create new project"
4. **Wait:** ~2 minutes for setup (grab a coffee ☕)

---

## Step 3: Get Your Connection String

1. **In your Supabase project dashboard:**
   - Click **"Settings"** (gear icon in sidebar)
   - Click **"Database"**
   - Scroll to **"Connection string"**
   - Select **"URI"** tab
   - Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```

2. **Replace `[YOUR-PASSWORD]`** with the password you set in Step 2

---

## Step 4: Update Your Backend Configuration

### 4.1 Edit backend/.env file

```powershell
cd backend
copy .env.example .env
notepad .env
```

### 4.2 Paste your Supabase connection string:

```env
# Replace this line:
DATABASE_URL="postgresql://postgres:password@localhost:5432/econsultation_db"

# With your Supabase connection string:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

# Also add your Groq API key (get free key from https://console.groq.com):
GROQ_API_KEY="your_groq_api_key_here"
```

**Save and close** the file.

---

## Step 5: Setup Database Schema with Prisma

```powershell
# Make sure you're in the backend folder
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\backend

# Activate virtual environment (if not already activated)
.\venv\Scripts\Activate.ps1

# Generate Prisma client
prisma generate

# Push schema to Supabase (creates all tables automatically!)
prisma db push
```

**Expected output:**
```
🚀  Your database is now in sync with your Prisma schema. Done in 5.2s
✔ Generated Prisma Client Python to ...
```

---

## Step 6: Verify in Supabase Dashboard

1. **Go back to Supabase dashboard**
2. **Click:** "Table Editor" in sidebar
3. **You should see 3 tables:**
   - ✅ `Feedback`
   - ✅ `LegalPrecedent`
   - ✅ `HistoricalImpact`

That's it! Your database is ready! 🎉

---

## Step 7: Run Your Application

### Terminal 1 - Backend:
```powershell
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\backend
.\venv\Scripts\Activate.ps1
python main.py
```

### Terminal 2 - Frontend:
```powershell
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\frontend
npm run dev
```

### Open Browser:
```
http://localhost:3000
```

---

## 🎯 Complete Setup Checklist

### Prerequisites (Install these first):
- [ ] **Python 3.10+** - https://www.python.org/downloads/
  - ⚠️ Check "Add Python to PATH" during install
  - Verify: `python --version`

- [ ] **Node.js 18+** - https://nodejs.org/
  - Verify: `node --version` and `npm --version`

- [ ] ✅ **Database** - Using Supabase (no local install needed!)

### Backend Setup:
```powershell
# 1. Create virtual environment
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\backend
python -m venv venv

# 2. Activate virtual environment
.\venv\Scripts\Activate.ps1

# 3. Install Python packages (~5-10 mins)
pip install -r requirements.txt

# 4. Configure environment
copy .env.example .env
notepad .env
# Paste your Supabase DATABASE_URL and GROQ_API_KEY

# 5. Setup database schema
prisma generate
prisma db push
```

### Frontend Setup:
```powershell
# 1. Install dependencies (~3-5 mins)
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\frontend
npm install

# 2. Configure environment
copy .env.local.example .env.local
# Default settings should work!
```

---

## 🎁 Bonus: Supabase Features

### Visual Database Management
- **Table Editor:** Add/edit/delete data directly
- **SQL Editor:** Run custom queries
- **Database Backups:** Automatic backups on paid plans

### View Your Data
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Click "Feedback" table
4. See all submitted feedback in real-time!

### Monitor Database
- **Logs:** See all queries in "Logs" section
- **Reports:** Database usage and performance
- **API:** Supabase also provides REST API (bonus!)

---

## 🆘 Troubleshooting

### "Can't reach database server"
- ✅ Check your internet connection
- ✅ Verify DATABASE_URL is correct (no extra spaces)
- ✅ Ensure password in DATABASE_URL matches your Supabase project password

### "prisma: command not found"
- ✅ Make sure virtual environment is activated: `.\venv\Scripts\Activate.ps1`
- ✅ Reinstall prisma: `pip install prisma`

### Prisma push fails with SSL error
- Add `?sslmode=require` to end of your DATABASE_URL:
```env
DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres?sslmode=require"
```

---

## 💰 Supabase Free Tier Limits

Perfect for development and small projects:
- ✅ 500 MB database space
- ✅ 2 GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Social OAuth providers
- ✅ 7-day log retention

**For this project:** The free tier is more than enough! You can store thousands of feedback entries.

---

## 🔄 Future: Migrate to Production

When you're ready to deploy:

1. **Keep Supabase** (upgrade to Pro if needed - $25/month)
2. **Or migrate** to:
   - Railway.app (includes PostgreSQL)
   - Render.com (free PostgreSQL tier)
   - AWS RDS, Azure Database, Google Cloud SQL

**Migration is easy:** Just export data from Supabase and import to new database!

---

## ⚡ Quick Commands Reference

```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Frontend
cd frontend
npm run dev

# Database operations
prisma generate          # Generate client
prisma db push          # Push schema changes
prisma studio           # Open visual database browser
prisma db pull          # Pull schema from database
```

---

**Total Setup Time with Supabase:** ~15 minutes (vs 30+ with local PostgreSQL)

**Next:** Follow this guide step by step, starting with creating your Supabase account! 🚀
