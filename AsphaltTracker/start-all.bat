@echo off
echo 🚀 Starting AsphaltTracker Enhanced in Production Mode...
echo.

echo 📦 Building application and services...
call npm run build:all
if %errorlevel% neq 0 (
    echo ❌ Build failed
    pause
    exit /b 1
)

echo.
echo ✅ Build completed successfully!
echo.

echo 🌐 Starting main application...
start "AsphaltTracker-App" cmd /k "npm run start"

echo ⏳ Waiting for main application to start...
timeout /t 5 /nobreak >nul

echo 🤖 Starting Restack services...
start "AsphaltTracker-Services" cmd /k "npm run services:start"

echo.
echo ✅ AsphaltTracker Enhanced started successfully!
echo.
echo 📊 Main Application: http://localhost:5000
echo 🤖 Restack Dashboard: http://localhost:5233
echo 📡 WebSocket Server: ws://localhost:5001
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5000

echo.
echo 🎉 AsphaltTracker Enhanced is now running!
echo.
echo To stop all services:
echo 1. Close the AsphaltTracker-App window
echo 2. Close the AsphaltTracker-Services window
echo.
pause
