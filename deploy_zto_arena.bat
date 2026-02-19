@echo off
echo ==========================================================
echo   🚀 ZTO Arena: Deploying to Production (ztoevent.com)
echo ==========================================================
echo.

echo [1/3] Saving Local Changes...
git add .
git commit -m "Release: ZTO Arena Sports Module (Commercial Edition)"
if %ERRORLEVEL% NEQ 0 echo (No new changes to commit or git not found)

echo.
echo [2/3] pushing to GitHub (Backup)...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo [!] GitHub Push Failed. Please check your internet connection or credentials.
    pause
    exit /b
)

echo.
echo [3/3] Deploying to Vercel Production...
echo    target: ztoevent.com
call npx vercel --prod

echo.
echo [3/3] FINAL STEP: Database Migration
echo    I have created the SQL file for the Sports Module.
echo    I will open it for you now. 
echo    -> COPY the content and RUN it in your Supabase SQL Editor.
echo.
timeout /t 3
start "" "supabase\schema_sports.sql"
start https://supabase.com/dashboard/project/_/sql

echo.
echo ==========================================================
echo   ✅ Deployment Script Finished.
echo      If Vercel command worked, your site is live!
echo ==========================================================
pause
