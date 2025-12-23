@echo off
REM Portfolio Application Startup Script for Windows

echo 🚀 Starting Portfolio Crypto Tracker...

REM Check if .env exists, if not create from example
if not exist .env (
    echo 📝 Creating .env file from example...
    copy .env.example .env
    echo ✅ .env file created. You can modify it if needed.
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker and try again.
    pause
    exit /b 1
)

REM Start the application
echo 🐳 Building and starting Docker containers...
docker-compose up --build

echo 🎉 Application should be available at:
echo    Frontend: http://localhost:5174
echo    Backend:  http://localhost:8083
pause