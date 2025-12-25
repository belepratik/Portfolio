@echo off
REM Portfolio Application Startup Script for Windows

echo 🚀 Starting Portfolio Crypto Tracker...
echo.

REM Check if .env exists, if not create from example
if not exist .env (
    echo 📝 Creating .env file from example...
    if exist .env.example (
        copy .env.example .env >nul
        echo ✅ .env file created. You can modify it if needed.
    ) else (
        echo ❌ .env.example not found. Creating default .env...
        (
            echo # Database Configuration
            echo MYSQL_ROOT_PASSWORD=Priyabele1!
            echo MYSQL_DATABASE=portfolio_db
            echo MYSQL_USER=portfolio_user
            echo MYSQL_PASSWORD=portfolio_pass
            echo MYSQL_PORT=3307
            echo.
            echo # Application Ports
            echo BACKEND_PORT=8083
            echo FRONTEND_PORT=5174
            echo.
            echo # JWT Configuration
            echo JWT_SECRET=your-jwt-secret-key-here
        ) > .env
        echo ✅ Default .env file created.
    )
    echo.
)

REM Check if Docker is running
echo 🔍 Checking if Docker is running...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    echo.
    echo 💡 Tip: Make sure Docker Desktop is installed and running.
    pause
    exit /b 1
)
echo ✅ Docker is running.
echo.

REM Clean up any existing containers (optional)
echo 🧹 Cleaning up existing containers...
docker-compose down >nul 2>&1
echo.

REM Start the application
echo 🐳 Building and starting Docker containers...
echo    This may take a few minutes on first run...
echo.
docker-compose up --build

echo.
echo 🎉 Application startup complete!
echo.
echo 📱 Access your application at:
echo    Frontend: http://localhost:5174
echo    Backend:  http://localhost:8083
echo.
echo 💡 Tip: Use Ctrl+C to stop all services
echo 💡 Or run 'docker-compose down' in another terminal
echo.
pause