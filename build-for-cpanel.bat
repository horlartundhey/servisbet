@echo off
REM ServisbetA Frontend Build Script for Shared Hosting Deployment
REM This script builds the production bundle ready for cPanel upload

echo ========================================
echo ServisbetA Frontend Build Script
echo ========================================
echo.

REM Navigate to client directory
cd client

echo [1/4] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build production bundle
    pause
    exit /b 1
)

echo.
echo [3/4] Copying .htaccess to dist folder...
copy /Y .htaccess dist\.htaccess
if errorlevel 1 (
    echo WARNING: Failed to copy .htaccess
)

echo.
echo [4/4] Creating deployment package...
cd dist
echo.
echo ========================================
echo BUILD SUCCESSFUL!
echo ========================================
echo.
echo Files ready for deployment in: client\dist\
echo.
echo Next steps:
echo 1. Go to client\dist folder
echo 2. Select ALL files and folders
echo 3. Upload to your cPanel public_html folder
echo 4. Visit your domain to verify
echo.
echo API Server: https://servisbeta-server.vercel.app/api
echo.
pause
