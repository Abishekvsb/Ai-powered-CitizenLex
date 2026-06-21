# CitizenLex Cloud Deployment Automation Script

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "   CitizenLex Production Deployment Setup   " -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

# 1. Verify Git Status and Push to GitHub
Write-Host "`n[1/3] Pushing latest configuration to GitHub..." -ForegroundColor Yellow
& "C:\Program Files\Git\bin\git.exe" add .
& "C:\Program Files\Git\bin\git.exe" commit -m "Production ready setup" -ErrorAction SilentlyContinue
& "C:\Program Files\Git\bin\git.exe" push origin main
Write-Host "✓ GitHub repository is in sync!" -ForegroundColor Green

# 2. Launch Railway Deployment Flow
Write-Host "`n[2/3] Spawning Railway Database & Backend deployment..." -ForegroundColor Yellow
Write-Host "Opening interactive command prompt for Railway login and setup..." -ForegroundColor DarkYellow
Start-Process cmd.exe -ArgumentList "/k cd backend && npx railway login && npx railway init"

# 3. Launch Vercel Frontend Deployment Flow
Write-Host "`n[3/3] Spawning Vercel Frontend deployment..." -ForegroundColor Yellow
Write-Host "Opening interactive command prompt for Vercel login and setup..." -ForegroundColor DarkYellow
Start-Process cmd.exe -ArgumentList "/k cd frontend && npx vercel login && npx vercel"

Write-Host "`n==============================================" -ForegroundColor Cyan
Write-Host "Spawning complete! Please complete the logins in the opened windows." -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Cyan
