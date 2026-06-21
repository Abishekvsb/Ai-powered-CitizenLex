@echo off
echo ==============================================
echo    CitizenLex Production Deployment Setup   
echo ==============================================

echo [1/3] Pushing latest configuration to GitHub...
"C:\Program Files\Git\bin\git.exe" add .
"C:\Program Files\Git\bin\git.exe" commit -m "Production ready setup"
"C:\Program Files\Git\bin\git.exe" push origin main
echo ✓ GitHub repository is in sync!

echo [2/3] Spawning Railway Database ^& Backend deployment...
echo Opening interactive command prompt for Railway login and setup...
start cmd.exe /k "cd backend && npx railway login && npx railway init"

echo [3/3] Spawning Vercel Frontend deployment...
echo Opening interactive command prompt for Vercel login and setup...
start cmd.exe /k "cd frontend && npx vercel login && npx vercel"

echo ==============================================
echo Spawning complete! Please complete the logins in the opened windows.
echo ==============================================
