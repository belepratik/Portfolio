#!/bin/bash

# Portfolio Application Stop Script for Unix/Linux/macOS

echo "🛑 Stopping Portfolio Crypto Tracker..."
echo

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running."
    echo
    exit 1
fi

echo "🐳 Stopping Docker containers..."
docker-compose down

echo
echo "✅ All containers stopped successfully!"
echo
echo "💡 Tip: To also remove volumes (delete all data), run:"
echo "   docker-compose down -v"
echo