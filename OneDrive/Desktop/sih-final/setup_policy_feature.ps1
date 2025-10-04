# Policy Context Feature Setup Script
# Run this script to set up the policy context feature

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Policy Context Feature Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Apply database migration
Write-Host "[1/3] Applying database migration..." -ForegroundColor Yellow
Set-Location backend
python -m prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Database migration failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database migration successful!" -ForegroundColor Green
Write-Host ""

# Step 2: Seed policy data
Write-Host "[2/3] Seeding policy data..." -ForegroundColor Yellow
python seed_policy.py
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Policy seeding failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Policy seeding successful!" -ForegroundColor Green
Write-Host ""

# Step 3: Generate Prisma client
Write-Host "[3/3] Generating Prisma client..." -ForegroundColor Yellow
python -m prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Prisma generate failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Prisma client generated!" -ForegroundColor Green
Write-Host ""

Set-Location ..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: cd backend; python main.py" -ForegroundColor White
Write-Host "2. Start frontend: cd frontend; npm run dev" -ForegroundColor White
Write-Host "3. Visit: http://localhost:3001/admin/dashboard-new" -ForegroundColor White
Write-Host ""
Write-Host "The dashboard will now show the policy context at the top!" -ForegroundColor Cyan
