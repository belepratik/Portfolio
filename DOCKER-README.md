# Portfolio Crypto Trading App - Docker Setup

## Quick Start (2 Commands Only!)

```bash
# 1. Start everything
docker-compose up -d

# 2. Open your browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080# Database UI: http://localhost:8081 (phpMyAdmin)```

## What Gets Created:
- ✅ **MySQL Database** (persistent data storage)
- ✅ **Spring Boot Backend** (API server)
- ✅ **React Frontend** (web interface)
- ✅ **phpMyAdmin** (database management UI)
- ✅ **Automatic database initialization**
- ✅ **Data persistence** (survives restarts)

## Data Safety:
- 📁 **Database data** stored in Docker volume `portfolio_mysql_data`
- 🔒 **Data persists** even if containers are deleted
- 💾 **Automatic backups** available via volume export

## Management Commands:

```bash
# Start services
docker-compose up -d

# Stop services (data remains safe)
docker-compose down

# View logs
docker-compose logs -f

# Restart specific service
docker-compose restart backend

# Remove everything including data (CAUTION!)
docker-compose down -v
```

## System Requirements:
- Docker Desktop installed
- 4GB RAM minimum
- 2GB free disk space

## Default Database Credentials:
- **Database**: portfolio
- **Username**: portfoliouser  
- **Password**: portfoliopass123
- **Root Password**: rootpassword123

## First Time Setup:
1. Clone this repository
2. Run `docker-compose up -d`
3. Wait 2-3 minutes for services to initialize
4. Visit http://localhost:3000
5. Register a new account
6. Start trading!
7. **View database**: http://localhost:8081 (login: portfoliouser / portfoliopass123)

## Troubleshooting:
- **Port conflicts**: Change ports in docker-compose.yml
- **Slow startup**: Database initialization takes time on first run
- **Connection errors**: Wait for MySQL health check to pass

---
*Data is automatically persistent and safe! 🚀*