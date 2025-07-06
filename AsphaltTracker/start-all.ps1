# AsphaltTracker Enhanced PowerShell Startup Script

Write-Host "🚀 Starting AsphaltTracker Enhanced in Production Mode..." -ForegroundColor Green
Write-Host ""

# Build the application and services
Write-Host "📦 Building application and services..." -ForegroundColor Yellow
try {
    npm run build:all
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✅ Build completed successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build failed: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Start main application
Write-Host "🌐 Starting main application..." -ForegroundColor Cyan
$appProcess = Start-Process -FilePath "npm" -ArgumentList "run", "start" -WindowStyle Normal -PassThru
Write-Host "✅ Main application started (PID: $($appProcess.Id))" -ForegroundColor Green

# Wait for main app to start
Write-Host "⏳ Waiting for main application to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test if main app is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Main application is healthy" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Main application may still be starting..." -ForegroundColor Yellow
}

# Start Restack services
Write-Host "🤖 Starting Restack services..." -ForegroundColor Cyan
$servicesProcess = Start-Process -FilePath "npm" -ArgumentList "run", "services:start" -WindowStyle Normal -PassThru
Write-Host "✅ Restack services started (PID: $($servicesProcess.Id))" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 AsphaltTracker Enhanced started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Main Application: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🤖 Restack Dashboard: http://localhost:5233" -ForegroundColor Cyan
Write-Host "📡 WebSocket Server: ws://localhost:5001" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to open browser
$openBrowser = Read-Host "Open application in browser? (y/n)"
if ($openBrowser -eq "y" -or $openBrowser -eq "Y") {
    Start-Process "http://localhost:5000"
}

Write-Host ""
Write-Host "🔧 Service Management:" -ForegroundColor Yellow
Write-Host "  Main App PID: $($appProcess.Id)"
Write-Host "  Services PID: $($servicesProcess.Id)"
Write-Host ""
Write-Host "To stop services, use:" -ForegroundColor Yellow
Write-Host "  Stop-Process -Id $($appProcess.Id) -Force"
Write-Host "  Stop-Process -Id $($servicesProcess.Id) -Force"
Write-Host ""

# Keep script running and monitor processes
Write-Host "Press Ctrl+C to stop monitoring (services will continue running)" -ForegroundColor Yellow
Write-Host ""

try {
    while ($true) {
        Start-Sleep -Seconds 30
        
        # Check if processes are still running
        $appRunning = Get-Process -Id $appProcess.Id -ErrorAction SilentlyContinue
        $servicesRunning = Get-Process -Id $servicesProcess.Id -ErrorAction SilentlyContinue
        
        $timestamp = Get-Date -Format "HH:mm:ss"
        
        if ($appRunning -and $servicesRunning) {
            Write-Host "[$timestamp] ✅ All services running" -ForegroundColor Green
        } elseif ($appRunning) {
            Write-Host "[$timestamp] ⚠️ Main app running, services stopped" -ForegroundColor Yellow
        } elseif ($servicesRunning) {
            Write-Host "[$timestamp] ⚠️ Services running, main app stopped" -ForegroundColor Yellow
        } else {
            Write-Host "[$timestamp] ❌ All services stopped" -ForegroundColor Red
            break
        }
    }
} catch {
    Write-Host ""
    Write-Host "🛑 Monitoring stopped" -ForegroundColor Yellow
    Write-Host "Services are still running in the background" -ForegroundColor Cyan
}
