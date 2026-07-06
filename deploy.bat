@echo off
echo ==============================================
echo    CitizenLex Production Deployment Setup   
echo ==============================================
echo.
echo [1/3] Pushing latest configuration to GitHub...
git add .
git commit -m "Production ready setup"
git push origin main
echo.
echo [2/3] Spawning Railway Database and Backend deployment...
start cmd /k "cd backend && npx railway login && npx railway init"
echo.
echo [3/3] Spawning Vercel Frontend deployment...
start cmd /k "cd frontend && npx vercel login && npx vercel"
echo.
echo ==============================================
echo Spawning complete! Please complete logins in the opened windows.
echo ==============================================
