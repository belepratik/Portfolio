#!/bin/bash

# Portfolio Application Startup Script
echo "🚀 Starting Portfolio Crypto Tracker..."

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "✅ .env file created. You can modify it if needed."
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start the application
echo "🐳 Building and starting Docker containers..."
docker-compose up --build

echo "🎉 Application should be available at:"
echo "   Frontend: http://localhost:5174"
echo "   Backend:  http://localhost:8083"