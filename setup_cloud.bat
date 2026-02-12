@echo off
echo ===================================================
echo       Event-OS Cloud Sync Setup (One-Time)
echo ===================================================
echo.
echo 1. Setting up GitHub...
echo    A browser window will open to authorize GitHub.
echo    If it asks for a code, it will be displayed here.
echo.
gh auth login --web
if %ERRORLEVEL% NEQ 0 (
    echo GitHub login failed or was cancelled.
    pause
    exit /b
)

echo.
echo 2. Creating GitHub Repository...
gh repo create event-os-cloud --public --source=. --push
if %ERRORLEVEL% NEQ 0 (
    echo Repository creation failed (maybe it exists?). Trying to push existing...
    git push -u origin main
)

echo.
echo 3. Setting up Vercel Deployment...
echo    Enter your email if prompted and check your inbox.
call npx vercel login
if %ERRORLEVEL% NEQ 0 (
    echo Vercel login failed.
    pause
    exit /b
)

echo.
echo 4. Deploying to Vercel (First Time)...
call npx vercel --prod
echo.
echo ===================================================
echo       Setup Complete! System is ready.
echo ===================================================
pause
