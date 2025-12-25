@echo off
REM Portfolio Application Stop Script for Windows

echo 🛑 Stopping Portfolio Crypto Tracker...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running.
    echo.
    pause
    exit /b 1
)

echo 🐳 Stopping Docker containers...
docker-compose down

echo.
echo ✅ All containers stopped successfully!
echo.
echo 💡 Tip: To also remove volumes (delete all data), run:
echo    docker-compose down -v
echo.
pause