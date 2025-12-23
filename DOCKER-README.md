# 🚀 Portfolio Crypto Tracker - Docker Setup Guide

A full-stack cryptocurrency portfolio tracking application built with React frontend and Spring Boot backend.

## 📋 Prerequisites

- **Git** - for cloning the repository
- **Docker** - for containerization 
- **Docker Compose** - for orchestrating services

## 🛠️ Quick Start

### 1. Clone the Repository
```bash
git clone <your-repository-url>
cd DummyFolder_portfolioV2
```

### 2. Create Environment File
Copy the example environment file and customize if needed:
```bash
cp .env.example .env
```

Edit `.env` file if you want to change default values:
```env
# Database Configuration
MYSQL_ROOT_PASSWORD=Priyabele1!
MYSQL_DATABASE=portfolio_db
MYSQL_USER=portfolio_user
MYSQL_PASSWORD=portfolio_pass

# Application Configuration
BACKEND_PORT=8083
FRONTEND_PORT=5174
```

### 3. Run with Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Or run in detached mode (background)
docker-compose up --build -d
```

### 4. Access the Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8083
- **Database**: localhost:3307 (MySQL)

## 🔧 Docker Commands

### Basic Operations
```bash
# Start services
docker-compose up

# Start services in background
docker-compose up -d

# Stop services
docker-compose down

# Rebuild and start
docker-compose up --build

# View logs
docker-compose logs

# View logs for specific service
docker-compose logs frontend
docker-compose logs backend
docker-compose logs mysql
```

### Maintenance Commands
```bash
# Remove all containers and volumes (clean slate)
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Clean up unused Docker resources
docker system prune -a
```

## 🗄️ Database

The MySQL database will be automatically created with the schema when you first run the application. The application uses Hibernate with `ddl-auto=update` to manage database schema.

## 🧪 First Time Setup

1. Start the application: `docker-compose up --build`
2. Wait for all services to be healthy (check logs)
3. Navigate to http://localhost:5174
4. Register a new account to get started
5. Start tracking your crypto portfolio!

## 🔍 Troubleshooting

### Port Already in Use
If you get port conflicts, modify the ports in `.env` file:
```env
BACKEND_PORT=8084
FRONTEND_PORT=5175
```

### Database Connection Issues
- Ensure MySQL container is healthy: `docker-compose logs mysql`
- Check if the database container started successfully
- Verify environment variables in `.env`

### Frontend/Backend Communication Issues
- Check that all containers are in the same network
- Verify API endpoints in frontend are pointing to correct backend URL
- Check CORS configuration in backend

### View Service Status
```bash
# Check running containers
docker ps

# Check service health
docker-compose ps
```

## 📝 Development

### Local Development (outside Docker)
If you want to run services individually for development:

1. **Database**: `docker-compose up mysql -d`
2. **Backend**: `cd backend && mvn spring-boot:run`
3. **Frontend**: `cd frontend && npm install && npm run dev`

### Rebuilding Specific Services
```bash
# Rebuild only backend
docker-compose build backend
docker-compose up backend

# Rebuild only frontend  
docker-compose build frontend
docker-compose up frontend
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React App     │────│   Spring Boot   │────│     MySQL       │
│   (Frontend)    │    │    (Backend)    │    │   (Database)    │
│   Port: 5174    │    │   Port: 8083    │    │   Port: 3307    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Production Deployment

For production deployment, consider:
- Using production-grade database (AWS RDS, etc.)
- Setting up reverse proxy (Nginx)
- Implementing HTTPS/SSL
- Setting up monitoring and logging
- Using secrets management for credentials

---

**Happy Trading! 📈**