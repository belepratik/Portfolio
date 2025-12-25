#!/bin/bash

# Portfolio Application Startup Script for Unix/Linux/macOS

echo "🚀 Starting Portfolio Crypto Tracker..."
echo

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ .env file created. You can modify it if needed."
    else
        echo "❌ .env.example not found. Creating default .env..."
        cat > .env << EOF
# Database Configuration
MYSQL_ROOT_PASSWORD=Priyabele1!
MYSQL_DATABASE=portfolio_db
MYSQL_USER=portfolio_user
MYSQL_PASSWORD=portfolio_pass
MYSQL_PORT=3307

# Application Ports
BACKEND_PORT=8083
FRONTEND_PORT=5174

# JWT Configuration
JWT_SECRET=your-jwt-secret-key-here
EOF
        echo "✅ Default .env file created."
    fi
    echo
fi

# Check if Docker is running
echo "🔍 Checking if Docker is running..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    echo
    echo "💡 Tip: Make sure Docker is installed and running."
    exit 1
fi
echo "✅ Docker is running."
echo

# Clean up any existing containers (optional)
echo "🧹 Cleaning up existing containers..."
docker-compose down > /dev/null 2>&1
echo

# Start the application
echo "🐳 Building and starting Docker containers..."
echo "   This may take a few minutes on first run..."
echo
docker-compose up --build

echo
echo "🎉 Application startup complete!"
echo
echo "📱 Access your application at:"
echo "   Frontend: http://localhost:5174"
echo "   Backend:  http://localhost:8083"
echo
echo "💡 Tip: Use Ctrl+C to stop all services"
echo "💡 Or run 'docker-compose down' in another terminal"