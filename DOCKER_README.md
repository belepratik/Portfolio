# Crypto Portfolio Tracker - Docker Setup

## Prerequisites
Only **Docker Desktop** is required. No need to install:
- ❌ MySQL
- ❌ Java/JDK
- ❌ Node.js
- ❌ VS Code

## Quick Start

### 1. Install Docker Desktop
Download and install from: https://www.docker.com/products/docker-desktop/

### 2. Run the Application
Open a terminal in the project folder and run:

```bash
docker-compose up --build
```

This will:
- Start MySQL database
- Build and run the Spring Boot backend
- Build and run the React frontend

### 3. Access the Application
Open your browser and go to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8083/api

### 4. Stop the Application
Press `Ctrl+C` in the terminal, then run:

```bash
docker-compose down
```

To also remove the database data:
```bash
docker-compose down -v
```

## Useful Commands

| Command | Description |
|---------|-------------|
| `docker-compose up` | Start all services |
| `docker-compose up --build` | Rebuild and start |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop all services |
| `docker-compose logs -f` | View logs |
| `docker-compose logs backend` | View backend logs |
| `docker-compose ps` | List running services |

## Database Access
If you need to connect to MySQL directly:
- **Host**: localhost
- **Port**: 3307
- **Database**: crypto_portfolio
- **Username**: portfolio
- **Password**: portfolio123

## Troubleshooting

### Port already in use
If port 5173 or 8083 is already in use, edit `docker-compose.yml` and change the port mappings.

### Backend can't connect to MySQL
Wait a few seconds - MySQL takes time to initialize. The backend will retry automatically.

### Clear everything and start fresh
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```
