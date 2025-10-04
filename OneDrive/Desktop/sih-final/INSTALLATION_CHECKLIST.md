# 🔧 Installation Checklist

## Current Status: ❌ Missing Prerequisites

Use this checklist to track your installation progress:

---

## Step 1: Choose Your Database

### ✨ Option A: Supabase (RECOMMENDED - No Install!)

**Why choose this:**
- ✅ No software to install
- ✅ Free tier forever
- ✅ Setup in 2 minutes
- ✅ Cloud-hosted (accessible anywhere)
- ✅ Built-in GUI for database management

**Follow SUPABASE_SETUP.md** - Complete setup guide with screenshots!

**Quick steps:**
1. Go to https://supabase.com/ and create account
2. Create new project (2 min setup time)
3. Copy connection string
4. Paste in backend/.env file
5. Run `prisma db push` - Done!

---

### Option B: Local PostgreSQL (Advanced Users)

**Only choose this if:**
- You need offline database access
- You prefer local development
- You're comfortable with database administration

**See POSTGRESQL_FIX.md** for local PostgreSQL setup.

---

## Step 2: Install Required Software

### [ ] Python 3.10+
- **Download:** https://www.python.org/downloads/
- **Version:** Python 3.11 or 3.12 recommended
- **⚠️ CRITICAL:** Check "Add Python to PATH" during installation
- **Verify:** Open new PowerShell and run `python --version`
- **Status:** ❌ NOT INSTALLED

### [ ] Node.js 18+
- **Download:** https://nodejs.org/
- **Version:** LTS (v20.x recommended)
- **Install:** Use default options
- **Verify:** Open new PowerShell and run `node --version` and `npm --version`
- **Status:** ❓ UNKNOWN

### [ ] PostgreSQL 14+
- **Download:** https://www.postgresql.org/download/windows/
- **Version:** PostgreSQL 16 (latest stable) - **Recommended over v18**
- **⚠️ IMPORTANT:** Remember the postgres password you set
- **Default Port:** 5432 (keep default)
- **⚠️ CRITICAL:** Ensure "Command Line Tools" component is selected during install
- **Verify:** Open new PowerShell and run `psql --version`
- **Status:** ⚠️ INCOMPLETE INSTALLATION (bin folder empty - needs reinstall)
- **Fix Guide:** See POSTGRESQL_FIX.md for detailed reinstallation steps

**⏱️ Time:** ~10-15 minutes for all three

---

## Step 2: Backend Setup

### [ ] Create Python Virtual Environment
```powershell
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\backend
python -m venv venv
```

### [ ] Activate Virtual Environment
```powershell
.\venv\Scripts\Activate.ps1
```
*Note: If you get execution policy error, run:*
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### [ ] Install Python Packages
```powershell
pip install -r requirements.txt
```
**⏱️ Time:** ~5-10 minutes (downloads PyTorch, Transformers, etc.)

### [ ] Configure Environment Variables
```powershell
copy .env.example .env
notepad .env
```
**Edit these values:**
- `DATABASE_URL`: `postgresql://postgres:YOUR_PASSWORD@localhost:5432/econsultation_db`
- `GROQ_API_KEY`: Get free key from https://console.groq.com

### [ ] Create Database
```powershell
psql -U postgres -c "CREATE DATABASE econsultation_db;"
```
*Enter your postgres password when prompted*

### [ ] Generate Prisma Client
```powershell
prisma generate
```

### [ ] Push Database Schema
```powershell
prisma db push
```

---

## Step 3: Frontend Setup

### [ ] Install Node Packages
```powershell
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\frontend
npm install
```
**⏱️ Time:** ~3-5 minutes

### [ ] Configure Frontend Environment
```powershell
copy .env.local.example .env.local
```
*Default API URL is http://localhost:8000 (should work as-is)*

---

## Step 4: Run the Application

### [ ] Start Backend Server (Terminal 1)
```powershell
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\backend
.\venv\Scripts\Activate.ps1
python main.py
```
**Expected output:** 
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Loading ML models...
INFO:     Sentiment model loaded successfully
INFO:     Embedding model loaded successfully
```

### [ ] Start Frontend Dev Server (Terminal 2)
```powershell
cd C:\Users\Ronit Khanna\OneDrive\Desktop\sih-final\frontend
npm run dev
```
**Expected output:**
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
```

### [ ] Test the Application
- **Open browser:** http://localhost:3000
- **Try:** Submit a test feedback
- **Check:** Backend console should show processing logs

---

## ✅ Success Criteria

Your installation is complete when:
- [x] Backend runs without errors on port 8000
- [x] Frontend runs without errors on port 3000
- [x] You can submit feedback and see it appear in the list
- [x] Sentiment analysis shows scores and nuances

---

## 🆘 Common Issues

### "python: command not found"
- **Solution:** Restart PowerShell after installing Python, or manually add Python to PATH

### "Cannot be loaded because running scripts is disabled"
- **Solution:** Run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### "pip install -r requirements.txt" fails with torch error
- **Solution:** Install PyTorch separately: `pip install torch --index-url https://download.pytorch.org/whl/cpu`

### "psql: command not found"
- **Solution:** Restart PowerShell after PostgreSQL installation, or add to PATH manually

### Database connection error
- **Solution:** Check DATABASE_URL in backend/.env matches your postgres password and database name

### Port 8000 or 3000 already in use
- **Solution:** Stop other applications using these ports, or change ports in configuration

---

## 📁 Quick Reference

**Project Structure:**
```
sih-final/
├── backend/          # FastAPI application
│   ├── venv/        # Virtual environment (after setup)
│   ├── main.py      # Entry point
│   └── .env         # Configuration (create from .env.example)
├── frontend/         # Next.js application
│   ├── node_modules/ # Dependencies (after npm install)
│   └── .env.local   # Configuration (create from .env.local.example)
└── START_HERE.md    # Quick start guide
```

**Useful Commands:**
```powershell
# Check installations
python --version
node --version
npm --version
psql --version

# Backend development
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Frontend development
cd frontend
npm run dev

# Database management
psql -U postgres
\l                    # List databases
\c econsultation_db   # Connect to database
\dt                   # List tables
```

---

**Total Setup Time:** ~20-30 minutes
**Once installed, startup time:** ~30 seconds

**Next:** Open START_HERE.md for detailed instructions!
