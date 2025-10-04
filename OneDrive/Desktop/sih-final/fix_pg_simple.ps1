# PostgreSQL PATH Fix - Simple Version

Write-Host "Checking for PostgreSQL installation..." -ForegroundColor Cyan

# Find PostgreSQL
$pgPath = "C:\Program Files\PostgreSQL\18\bin"

if (Test-Path $pgPath) {
    Write-Host "Found PostgreSQL at: $pgPath" -ForegroundColor Green
    
    # Add to current session PATH
    $env:Path += ";$pgPath"
    
    # Test psql
    Write-Host "`nTesting psql command..." -ForegroundColor Cyan
    & "$pgPath\psql.exe" --version
    
    Write-Host "`nPostgreSQL is now available in THIS PowerShell session!" -ForegroundColor Green
    Write-Host "`nTo make this permanent, run:" -ForegroundColor Yellow
    Write-Host '$userPath = [Environment]::GetEnvironmentVariable("Path", "User")' -ForegroundColor White
    Write-Host '$newPath = $userPath + ";C:\Program Files\PostgreSQL\18\bin"' -ForegroundColor White
    Write-Host '[Environment]::SetEnvironmentVariable("Path", $newPath, "User")' -ForegroundColor White
    Write-Host "`nThen restart PowerShell." -ForegroundColor Yellow
    
} else {
    Write-Host "PostgreSQL not found at expected location: $pgPath" -ForegroundColor Red
    Write-Host "Please verify PostgreSQL installation location." -ForegroundColor Yellow
}
