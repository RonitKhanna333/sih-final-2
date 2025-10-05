# Supabase Setup Guide# 🚀 Using Supabase Instead of Local PostgreSQL



## 1. Create Supabase Project (2 minutes)## Why Supabase?



1. Go to [https://supabase.com](https://supabase.com)- ✅ **No local installation** - works in the cloud

2. Sign up/login with GitHub- ✅ **Free tier** - generous limits for development

3. Click "New Project"- ✅ **Built-in GUI** - manage database visually

4. Choose organization and project name: `sih-policy-platform`- ✅ **Instant setup** - ready in 2 minutes

5. Set database password (save it!)- ✅ **PostgreSQL compatible** - works with our Prisma schema

6. Choose region (closest to you)

7. Click "Create new project"---



## 2. Get Project URLs## Step 1: Create Supabase Account (2 minutes)



After project creation, go to **Settings > API**:1. **Go to:** https://supabase.com/

- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`2. **Click:** "Start your project"

- Copy **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`3. **Sign in with:** GitHub, Google, or Email

4. **It's FREE!** No credit card required

## 3. Update Environment Variables

---

Update your `.env.local` file:

```bash## Step 2: Create a New Project (1 minute)

NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"

NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key-here"1. **Click:** "New Project"

```2. **Fill in:**

   - **Name:** `econsultation` (or any name you like)

## 4. Create Database Tables   - **Database Password:** Choose a strong password and SAVE IT

   - **Region:** Choose closest to you (e.g., "South Asia (Mumbai)" or "Southeast Asia (Singapore)")

Run these SQL commands in **Supabase Dashboard > SQL Editor**:   - **Pricing Plan:** Free (includes 500MB database, 2GB bandwidth)



```sql3. **Click:** "Create new project"

-- Users table4. **Wait:** ~2 minutes for setup (grab a coffee ☕)

CREATE TABLE users (

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,---

  email VARCHAR UNIQUE NOT NULL,

  name VARCHAR NOT NULL,## Step 3: Get Your Connection String

  role VARCHAR DEFAULT 'client' CHECK (role IN ('admin', 'client')),

  password VARCHAR NOT NULL,1. **In your Supabase project dashboard:**

  created_at TIMESTAMPTZ DEFAULT NOW(),   - Click **"Settings"** (gear icon in sidebar)

  updated_at TIMESTAMPTZ DEFAULT NOW()   - Click **"Database"**

);   - Scroll to **"Connection string"**

   - Select **"URI"** tab

-- Feedback table   - Copy the connection string (looks like):

CREATE TABLE feedback (   ```

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres

  text TEXT NOT NULL,   ```

  sentiment VARCHAR CHECK (sentiment IN ('Positive', 'Negative', 'Neutral')),

  language VARCHAR DEFAULT 'English',2. **Replace `[YOUR-PASSWORD]`** with the password you set in Step 2

  nuances JSONB DEFAULT '{}',

  is_spam BOOLEAN DEFAULT FALSE,---

  legal_risk_score INTEGER DEFAULT 0,

  compliance_difficulty_score INTEGER DEFAULT 0,## Step 4: Update Your Backend Configuration

  business_growth_score INTEGER DEFAULT 0,

  stakeholder_type VARCHAR,### 4.1 Edit backend/.env file

  sector VARCHAR,

  edge_case_flags TEXT[] DEFAULT '{}',```powershell

  policy_id UUID,cd backend

  summary TEXT,copy .env.example .env

  created_at TIMESTAMPTZ DEFAULT NOW(),notepad .env

  updated_at TIMESTAMPTZ DEFAULT NOW()```

);

### 4.2 Paste your Supabase connection string:

-- Policies table

CREATE TABLE policies (```env

  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,# Replace this line:

  title VARCHAR NOT NULL,DATABASE_URL="postgresql://postgres:password@localhost:5432/econsultation_db"

  description TEXT,

  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published')),# With your Supabase connection string:

  created_at TIMESTAMPTZ DEFAULT NOW(),DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres"

  updated_at TIMESTAMPTZ DEFAULT NOW()

);# Also add your Groq API key (get free key from https://console.groq.com):

GROQ_API_KEY="your_groq_api_key_here"

-- Add foreign key after policies table exists```

ALTER TABLE feedback ADD CONSTRAINT fk_feedback_policy 

  FOREIGN KEY (policy_id) REFERENCES policies(id);**Save and close** the file.

```

---

## 5. Enable Row Level Security (Optional but Recommended)

## Step 5: Setup Database Schema with Prisma

```sql

-- Enable RLS```powershell

ALTER TABLE users ENABLE ROW LEVEL SECURITY;# Make sure you're in the backend folder

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\backend

ALTER TABLE policies ENABLE ROW LEVEL SECURITY;

# Activate virtual environment (if not already activated)

-- Allow public read access for demo (adjust as needed).\venv\Scripts\Activate.ps1

CREATE POLICY "Public read access" ON feedback FOR SELECT USING (true);

CREATE POLICY "Public insert access" ON feedback FOR INSERT WITH CHECK (true);# Generate Prisma client

```prisma generate



## 6. Test Connection# Push schema to Supabase (creates all tables automatically!)

prisma db push

After updating `.env.local`, the app should connect to Supabase automatically!```



## Benefits of Supabase:**Expected output:**

- ✅ **Better connectivity** than Neon```

- ✅ **No Prisma complexity** - Direct SQL calls🚀  Your database is now in sync with your Prisma schema. Done in 5.2s

- ✅ **Instant APIs** - Auto-generated REST endpoints✔ Generated Prisma Client Python to ...

- ✅ **Real-time** - Built-in subscriptions```

- ✅ **Auth built-in** - Can replace our custom JWT later

- ✅ **Dashboard** - Easy data viewing and management---

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
