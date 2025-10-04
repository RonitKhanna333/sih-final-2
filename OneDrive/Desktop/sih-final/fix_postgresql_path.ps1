# PostgreSQL PATH Fix Script
# This script adds PostgreSQL to your system PATH

Write-Host "=" * 60
Write-Host "PostgreSQL PATH Configuration Script"
Write-Host "=" * 60
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "For system-wide PATH changes, you need to run PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host ""
}

# Common PostgreSQL installation paths
$possiblePaths = @(
    "C:\Program Files\PostgreSQL\18\bin",
    "C:\Program Files\PostgreSQL\17\bin",
    "C:\Program Files\PostgreSQL\16\bin",
    "C:\Program Files\PostgreSQL\15\bin",
    "C:\Program Files\PostgreSQL\14\bin",
    "C:\Program Files (x86)\PostgreSQL\18\bin",
    "C:\Program Files (x86)\PostgreSQL\17\bin",
    "C:\Program Files (x86)\PostgreSQL\16\bin"
)

$postgresPath = $null

Write-Host "Searching for PostgreSQL installation..." -ForegroundColor Cyan
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $psqlExe = Join-Path $path "psql.exe"
        if (Test-Path $psqlExe) {
            $postgresPath = $path
            Write-Host "✓ Found PostgreSQL at: $path" -ForegroundColor Green
            break
        }
    }
}

if (-not $postgresPath) {
    Write-Host "✗ PostgreSQL installation not found in common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check if PostgreSQL is installed correctly:" -ForegroundColor Yellow
    Write-Host "1. Look for PostgreSQL in C:\Program Files\PostgreSQL\" -ForegroundColor Yellow
    Write-Host "2. Check if the bin folder contains psql.exe" -ForegroundColor Yellow
    Write-Host "3. If PostgreSQL is not installed, download from:" -ForegroundColor Yellow
    Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Check current PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -like "*$postgresPath*") {
    Write-Host "✓ PostgreSQL is already in your PATH" -ForegroundColor Green
    Write-Host ""
    Write-Host "Testing psql command..." -ForegroundColor Cyan
    & "$postgresPath\psql.exe" --version
    Write-Host ""
    Write-Host "If psql still doesn't work, try:" -ForegroundColor Yellow
    Write-Host "1. Close and reopen PowerShell" -ForegroundColor Yellow
    Write-Host "2. Or use full path: ""$postgresPath\psql.exe""" -ForegroundColor Yellow
    exit 0
}

# Add to PATH
Write-Host ""
Write-Host "Adding PostgreSQL to your PATH..." -ForegroundColor Cyan

try {
    $newPath = $currentPath + ";" + $postgresPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "User")
    Write-Host "✓ Successfully added PostgreSQL to PATH" -ForegroundColor Green
    Write-Host ""
    Write-Host "IMPORTANT: You must close and reopen PowerShell for changes to take effect!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After reopening PowerShell, test with: psql --version" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "PostgreSQL path added: $postgresPath" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to add PostgreSQL to PATH: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual steps to add PostgreSQL to PATH:" -ForegroundColor Yellow
    Write-Host "1. Open System Properties (Win + Pause/Break)" -ForegroundColor Yellow
    Write-Host "2. Click 'Advanced system settings'" -ForegroundColor Yellow
    Write-Host "3. Click 'Environment Variables'" -ForegroundColor Yellow
    Write-Host "4. Under 'User variables', select 'Path' and click 'Edit'" -ForegroundColor Yellow
    Write-Host "5. Click 'New' and add: $postgresPath" -ForegroundColor Yellow
    Write-Host "6. Click OK on all dialogs" -ForegroundColor Yellow
    Write-Host "7. Restart PowerShell" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "For now, you can use the full path:" -ForegroundColor Cyan
Write-Host """$postgresPath\psql.exe"" --version" -ForegroundColor White
