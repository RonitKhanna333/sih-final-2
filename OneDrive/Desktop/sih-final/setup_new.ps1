# OPINIZE Setup Script for Windows PowerShell
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "OPINIZE Setup - Starting..." -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} else {
    Write-Host "Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
} else {
    Write-Host "Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Setting up BACKEND..." -ForegroundColor Cyan
Set-Location backend

# Create virtual environment
if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Install Python dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
.\venv\Scripts\pip.exe install --upgrade pip
.\venv\Scripts\pip.exe install -r requirements.txt

# Create .env file
if (-Not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env - Please edit it with your config" -ForegroundColor Green
}

Write-Host ""
Write-Host "Setting up FRONTEND..." -ForegroundColor Cyan
Set-Location ../frontend

# Install Node dependencies
Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Create .env.local file
if (-Not (Test-Path ".env.local")) {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
    Copy-Item ".env.local.example" ".env.local"
}

Set-Location ..

Write-Host ""
Write-Host "=================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Edit backend\.env with your DATABASE_URL and GROQ_API_KEY" -ForegroundColor White
Write-Host "2. Create database: psql -U postgres -c 'CREATE DATABASE econsultation_db;'" -ForegroundColor White
Write-Host "3. Generate Prisma: cd backend; .\venv\Scripts\prisma.exe generate" -ForegroundColor White
Write-Host "4. Push schema: cd backend; .\venv\Scripts\prisma.exe db push" -ForegroundColor White
Write-Host "5. Start backend: cd backend; .\venv\Scripts\python.exe main.py" -ForegroundColor White
Write-Host "6. Start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "See README.md for detailed instructions" -ForegroundColor Gray
