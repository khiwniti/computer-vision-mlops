@echo off
echo 🏗️ Starting AsphaltTracker Embedded Infrastructure...
echo.

REM Check if Docker is running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not running
    echo Please install Docker Desktop and ensure it's running
    pause
    exit /b 1
)

echo 📋 Checking Docker Compose...
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please ensure Docker Compose is installed
    pause
    exit /b 1
)

echo.
echo 🔧 Setting up environment...
if not exist .env (
    echo 📝 Creating .env file from template...
    copy .env.infrastructure .env
    echo ✅ Environment file created
    echo ⚠️ Please review and customize .env file if needed
) else (
    echo ✅ Environment file already exists
)

echo.
echo 🚀 Starting infrastructure services...
docker-compose -f docker-compose.infrastructure.yml up -d

if %errorlevel% neq 0 (
    echo ❌ Failed to start infrastructure services
    pause
    exit /b 1
)

echo.
echo ⏳ Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo 🏥 Checking service health...

REM Check PostgreSQL
echo 📊 Checking PostgreSQL...
docker exec asphalt-postgres pg_isready -U postgres -d asphalt_tracker >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ PostgreSQL is ready
) else (
    echo ⚠️ PostgreSQL is starting...
)

REM Check Redis
echo 🔴 Checking Redis...
docker exec asphalt-redis redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Redis is ready
) else (
    echo ⚠️ Redis is starting...
)

REM Check ChromaDB
echo 🔗 Checking ChromaDB...
curl -s http://localhost:8000/api/v1/heartbeat >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ ChromaDB is ready
) else (
    echo ⚠️ ChromaDB is starting...
)

REM Check InfluxDB
echo 📈 Checking InfluxDB...
curl -s http://localhost:8086/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ InfluxDB is ready
) else (
    echo ⚠️ InfluxDB is starting...
)

echo.
echo 🎉 Infrastructure services started!
echo.
echo 📊 Service URLs:
echo   PostgreSQL:     localhost:5432
echo   Redis:          localhost:6379
echo   ChromaDB:       http://localhost:8000
echo   InfluxDB:       http://localhost:8086
echo   Grafana:        http://localhost:3000
echo   pgAdmin:        http://localhost:5050
echo   Redis Commander: http://localhost:8081
echo.
echo 🔧 Management Commands:
echo   View logs:      docker-compose -f docker-compose.infrastructure.yml logs -f
echo   Stop services:  docker-compose -f docker-compose.infrastructure.yml down
echo   Restart:        docker-compose -f docker-compose.infrastructure.yml restart
echo.
echo Press any key to continue...
pause >nul
