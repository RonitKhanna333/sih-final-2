# Installation Guide - OPINIZE

## Prerequisites Installation

### 1. Install Python 3.10+

**Option A: From python.org (Recommended)**
1. Go to https://www.python.org/downloads/
2. Download Python 3.10 or later (e.g., Python 3.11 or 3.12)
3. Run the installer
4. ✅ **IMPORTANT: Check "Add Python to PATH"**
5. Click "Install Now"
6. Verify: Open new PowerShell and run `python --version`

**Option B: From Microsoft Store**
1. Open Microsoft Store
2. Search for "Python 3.11" or "Python 3.12"
3. Install
4. Verify: `python --version`

### 2. Install Node.js 18+

1. Go to https://nodejs.org/
2. Download LTS version (18.x or 20.x)
3. Run the installer (use default options)
4. Verify: Open new PowerShell and run `node --version` and `npm --version`

### 3. Install PostgreSQL 14+

**Option A: Official Installer**
1. Go to https://www.postgresql.org/download/windows/
2. Download PostgreSQL 14 or later
3. Run installer
4. Remember the password you set for 'postgres' user
5. Add PostgreSQL bin folder to PATH:
   - Default: `C:\Program Files\PostgreSQL\14\bin`

**Option B: Using Chocolatey**
```powershell
choco install postgresql
```

Verify PostgreSQL:
```powershell
psql --version
```

## Manual Setup (After Prerequisites)

### Step 1: Backend Setup

```powershell
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies (this will take 5-10 minutes)
pip install -r requirements.txt

# Copy environment template
copy .env.example .env

# Edit .env file with your configuration
notepad .env
```

**Edit `.env` file:**
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/econsultation_db"
GROQ_API_KEY="your_groq_api_key_here"
HOST="0.0.0.0"
PORT=8000
CORS_ORIGINS="http://localhost:3000"
```

Get Groq API Key (Free):
1. Go to https://console.groq.com
2. Sign up / Log in
3. Create API key
4. Copy to `.env` file

**Create Database:**
```powershell
# Create PostgreSQL database
psql -U postgres
# Enter your PostgreSQL password
# Then in psql:
CREATE DATABASE econsultation_db;
\q
```

**Generate Prisma Client:**
```powershell
# Make sure you're in backend folder with venv activated
prisma generate
prisma db push
```

### Step 2: Frontend Setup

```powershell
# Navigate to frontend (from project root)
cd frontend

# Install dependencies (this will take 3-5 minutes)
npm install

# Copy environment template
copy .env.local.example .env.local

# The default values should work:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Running the Application

### Terminal 1 - Backend

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
✓ Database connected
✓ Sentiment model loaded
✓ Embedding model loaded
```

Backend is now running at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Terminal 2 - Frontend

```powershell
cd frontend
npm run dev
```

You should see:
```
ready - started server on 0.0.0.0:3000
```

Frontend is now running at: http://localhost:3000

## Testing the Application

1. **Open browser**: http://localhost:3000
2. **Submit feedback**: Enter text and click "Submit Feedback"
3. **View results**: See sentiment analysis, nuances, scores
4. **Check API docs**: http://localhost:8000/docs

## Common Issues & Solutions

### Issue: "Python not found"
**Solution**: 
- Restart PowerShell after installing Python
- Make sure "Add to PATH" was checked during installation
- Manually add Python to PATH in System Environment Variables

### Issue: "node: command not found"
**Solution**:
- Restart PowerShell after installing Node.js
- Verify installation: `node --version`

### Issue: "psql: command not found"
**Solution**:
- Add PostgreSQL bin to PATH
- Default location: `C:\Program Files\PostgreSQL\14\bin`
- Restart PowerShell

### Issue: "prisma: command not found"
**Solution**:
- Make sure virtual environment is activated
- Try: `python -m prisma generate`
- Or use full path: `.\venv\Scripts\prisma.exe generate`

### Issue: Database connection error
**Solution**:
- Verify PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Test connection: `psql -U postgres -d econsultation_db`

### Issue: Port 8000 or 3000 already in use
**Solution**:
```powershell
# Backend: Change port in backend/.env
PORT=8001

# Frontend: Run on different port
npm run dev -- -p 3001
```

### Issue: "Module not found" errors
**Solution**:
```powershell
# Backend
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Simplified Installation Commands

Once prerequisites are installed, run these commands:

```powershell
# Backend
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
# Edit .env with your configuration
prisma generate
prisma db push

# Frontend (new terminal)
cd frontend
npm install
copy .env.local.example .env.local

# Run (2 separate terminals)
# Terminal 1:
cd backend
.\venv\Scripts\Activate.ps1
python main.py

# Terminal 2:
cd frontend
npm run dev
```

## Next Steps

After successful installation:

1. ✅ Backend running on http://localhost:8000
2. ✅ Frontend running on http://localhost:3000
3. ✅ Test by submitting feedback
4. 📖 Read README.md for full feature documentation
5. 🔍 Explore API at http://localhost:8000/docs

## Getting Help

- Check console output for error messages
- Review logs in terminal windows
- Ensure all prerequisites are properly installed
- Verify environment variables in .env files

---

**Congratulations! Your OPINIZE platform is now ready to use! 🎉**
