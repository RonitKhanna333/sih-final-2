# ⚠️ IMPORTANT: Prerequisites Required

## 🎉 RECOMMENDED: Use Supabase (No PostgreSQL Install Needed!)

**We highly recommend using Supabase instead of local PostgreSQL:**
- ✅ No local installation required
- ✅ Free tier (perfect for development)
- ✅ Setup in 2 minutes
- ✅ Works perfectly with this project

**👉 See SUPABASE_SETUP.md for complete instructions!**

---

## Before You Can Run This Project

Your system is **missing required software**. Please install the following:

### ❌ Python 3.10+ (NOT INSTALLED)
**Install from:** https://www.python.org/downloads/
- Download Python 3.11 or 3.12
- ✅ **CHECK "Add Python to PATH" during installation**
- Restart PowerShell after installation
- Verify: `python --version`

### ❓ Node.js 18+ (Status Unknown)
**Install from:** https://nodejs.org/
- Download LTS version (v20.x recommended)
- Install with default options
- Verify: `node --version` and `npm --version`

### ✨ Database: Use Supabase (RECOMMENDED)
**Why Supabase?**
- ✅ **No local installation needed!**
- ✅ Free PostgreSQL database in the cloud
- ✅ Setup in 2 minutes
- ✅ Built-in visual database management

**📖 See SUPABASE_SETUP.md for step-by-step instructions**

### Alternative: Local PostgreSQL (If you prefer)
**Status:** ❌ Your PostgreSQL 18 installation is incomplete
- If you want local PostgreSQL, see POSTGRESQL_FIX.md
- **But we recommend Supabase instead - it's much easier!**

---

## After Installing Prerequisites

### Quick Setup:

1. **Install Python dependencies:**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

2. **Configure backend:**
```powershell
copy .env.example .env
notepad .env  # Edit with your DATABASE_URL and GROQ_API_KEY
```

3. **Setup database:**
```powershell
psql -U postgres -c "CREATE DATABASE econsultation_db;"
prisma generate
prisma db push
```

4. **Install frontend dependencies:**
```powershell
cd ..\frontend
npm install
copy .env.local.example .env.local
```

5. **Run the application:**

Terminal 1 (Backend):
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

Terminal 2 (Frontend):
```powershell
cd frontend
npm run dev
```

---

## 📚 Full Documentation

- **INSTALLATION.md** - Detailed installation guide with troubleshooting
- **README.md** - Full project documentation
- **QUICKSTART.md** - Quick reference guide

---

**Once prerequisites are installed, the entire setup takes ~10 minutes!**
