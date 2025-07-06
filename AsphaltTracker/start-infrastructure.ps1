# AsphaltTracker Infrastructure PowerShell Startup Script

Write-Host "🏗️ Starting AsphaltTracker Embedded Infrastructure..." -ForegroundColor Green
Write-Host ""

# Check if Docker is running
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed or not running" -ForegroundColor Red
    Write-Host "Please install Docker Desktop and ensure it's running" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "✅ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose is not available" -ForegroundColor Red
    Write-Host "Please ensure Docker Compose is installed" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "🔧 Setting up environment..." -ForegroundColor Cyan

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.infrastructure" ".env"
    Write-Host "✅ Environment file created" -ForegroundColor Green
    Write-Host "⚠️ Please review and customize .env file if needed" -ForegroundColor Yellow
} else {
    Write-Host "✅ Environment file already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting infrastructure services..." -ForegroundColor Cyan

try {
    docker-compose -f docker-compose.infrastructure.yml up -d
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose failed"
    }
    Write-Host "✅ Infrastructure services started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start infrastructure services: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "🏥 Checking service health..." -ForegroundColor Cyan

# Function to check service health
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [string]$TestCommand,
        [string]$Icon
    )
    
    Write-Host "$Icon Checking $ServiceName..." -ForegroundColor Yellow
    try {
        Invoke-Expression $TestCommand | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $ServiceName is ready" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️ $ServiceName is starting..." -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "⚠️ $ServiceName is starting..." -ForegroundColor Yellow
        return $false
    }
}

# Check each service
$postgresReady = Test-ServiceHealth "PostgreSQL" "docker exec asphalt-postgres pg_isready -U postgres -d asphalt_tracker" "📊"
$redisReady = Test-ServiceHealth "Redis" "docker exec asphalt-redis redis-cli ping" "🔴"

# Check ChromaDB with HTTP request
Write-Host "🔗 Checking ChromaDB..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/heartbeat" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ ChromaDB is ready" -ForegroundColor Green
        $chromaReady = $true
    } else {
        Write-Host "⚠️ ChromaDB is starting..." -ForegroundColor Yellow
        $chromaReady = $false
    }
} catch {
    Write-Host "⚠️ ChromaDB is starting..." -ForegroundColor Yellow
    $chromaReady = $false
}

# Check InfluxDB with HTTP request
Write-Host "📈 Checking InfluxDB..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8086/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ InfluxDB is ready" -ForegroundColor Green
        $influxReady = $true
    } else {
        Write-Host "⚠️ InfluxDB is starting..." -ForegroundColor Yellow
        $influxReady = $false
    }
} catch {
    Write-Host "⚠️ InfluxDB is starting..." -ForegroundColor Yellow
    $influxReady = $false
}

Write-Host ""
Write-Host "🎉 Infrastructure services started!" -ForegroundColor Green
Write-Host ""

# Display service information
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "  PostgreSQL:      localhost:5432" -ForegroundColor White
Write-Host "  Redis:           localhost:6379" -ForegroundColor White
Write-Host "  ChromaDB:        http://localhost:8000" -ForegroundColor White
Write-Host "  InfluxDB:        http://localhost:8086" -ForegroundColor White
Write-Host "  Grafana:         http://localhost:3000" -ForegroundColor White
Write-Host "  pgAdmin:         http://localhost:5050" -ForegroundColor White
Write-Host "  Redis Commander: http://localhost:8081" -ForegroundColor White
Write-Host ""

Write-Host "🔧 Management Commands:" -ForegroundColor Cyan
Write-Host "  View logs:       docker-compose -f docker-compose.infrastructure.yml logs -f" -ForegroundColor White
Write-Host "  Stop services:   docker-compose -f docker-compose.infrastructure.yml down" -ForegroundColor White
Write-Host "  Restart:         docker-compose -f docker-compose.infrastructure.yml restart" -ForegroundColor White
Write-Host ""

Write-Host "🔍 Service Status:" -ForegroundColor Cyan
Write-Host "  PostgreSQL: $(if ($postgresReady) { '✅ Ready' } else { '⚠️ Starting' })" -ForegroundColor White
Write-Host "  Redis:      $(if ($redisReady) { '✅ Ready' } else { '⚠️ Starting' })" -ForegroundColor White
Write-Host "  ChromaDB:   $(if ($chromaReady) { '✅ Ready' } else { '⚠️ Starting' })" -ForegroundColor White
Write-Host "  InfluxDB:   $(if ($influxReady) { '✅ Ready' } else { '⚠️ Starting' })" -ForegroundColor White
Write-Host ""

# Ask if user wants to open management interfaces
$openInterfaces = Read-Host "Open management interfaces in browser? (y/n)"
if ($openInterfaces -eq "y" -or $openInterfaces -eq "Y") {
    Write-Host "🌐 Opening management interfaces..." -ForegroundColor Cyan
    Start-Process "http://localhost:3000"    # Grafana
    Start-Process "http://localhost:5050"    # pgAdmin
    Start-Process "http://localhost:8081"    # Redis Commander
}

Write-Host ""
Write-Host "✅ Infrastructure is ready for AsphaltTracker!" -ForegroundColor Green
Write-Host "You can now start the main application with:" -ForegroundColor Yellow
Write-Host "  npm run start:all" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
