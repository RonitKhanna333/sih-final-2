@echo off
echo.
echo ================================================
echo   Running Feedback Seed Script
echo ================================================
echo.
echo This will add 10 sample feedback entries...
echo.

node scripts/seed-via-api.js

echo.
echo ================================================
echo   Done!
echo ================================================
echo.
echo Now refresh your browser at:
echo http://localhost:3000/admin/dashboard-new
echo.
pause
