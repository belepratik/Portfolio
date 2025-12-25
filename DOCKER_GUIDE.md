# Portfolio Crypto Tracker - Docker Setup Guide

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed and running
- Git (to clone the repository)

### 1. Clone Repository (if not already done)
```bash
git clone <repository-url>
cd Portfolio
```

### 2. Start the Application
```bash
docker-compose up --build
```

### 3. Access the Application
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:8083
- **MySQL Database**: localhost:3307

---

## 📋 Detailed Docker Commands

### Starting the Application

#### Start in Foreground (with logs visible)
```bash
docker-compose up --build
```

#### Start in Background (detached mode)
```bash
docker-compose up -d --build
```

#### Start specific services only
```bash
# Start only database
docker-compose up -d mysql

# Start database and backend
docker-compose up -d mysql backend

# Start all services
docker-compose up -d
```

### Stopping the Application

#### Stop all services
```bash
docker-compose down
```

#### Stop and remove volumes (⚠️ This will delete all data)
```bash
docker-compose down -v
```

#### Stop specific service
```bash
docker-compose stop frontend
docker-compose stop backend
docker-compose stop mysql
```

### Managing Services

#### View running containers
```bash
docker-compose ps
```

#### View logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Follow logs (real-time)
docker-compose logs -f backend
```

#### Restart services
```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

#### Rebuild services (after code changes)
```bash
# Rebuild and restart all
docker-compose up --build

# Rebuild specific service
docker-compose build backend
docker-compose up -d backend
```

---

## ⚙️ Environment Configuration

### Default Configuration (.env file)
```env
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
```

### Customizing Ports
Edit the `.env` file to change ports:
```env
FRONTEND_PORT=3000
BACKEND_PORT=8080
MYSQL_PORT=3306
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
netstat -an | findstr :5174
netstat -an | findstr :8083

# Change ports in .env file or stop conflicting services
```

#### 2. Database Connection Issues
```bash
# Check MySQL container health
docker-compose ps
docker-compose logs mysql

# Reset database (⚠️ Deletes all data)
docker-compose down -v
docker-compose up -d mysql
```

#### 3. Backend Not Starting
```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend
```

#### 4. Frontend Build Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up -d frontend
```

### Health Checks
```bash
# Check if all services are healthy
docker-compose ps

# Test backend API
curl http://localhost:8083/api/auth/validate

# Test frontend
curl http://localhost:5174
```

### Clean Reset (Nuclear Option)
```bash
# Stop everything and remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove Docker images (optional)
docker system prune -f

# Start fresh
docker-compose up --build
```

---

## 🛠️ Development Workflows

### Making Code Changes

#### Frontend Changes
1. Make changes to files in `frontend/src/`
2. Rebuild and restart:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

#### Backend Changes
1. Make changes to files in `backend/src/`
2. Rebuild and restart:
   ```bash
   docker-compose build backend
   docker-compose up -d backend
   ```

### Database Management

#### Access MySQL Database
```bash
# Using Docker exec
docker exec -it portfolio-mysql mysql -u root -p

# Using external MySQL client
mysql -h localhost -P 3307 -u root -p
```

#### Backup Database
```bash
docker exec portfolio-mysql mysqldump -u root -p portfolio_db > backup.sql
```

#### Restore Database
```bash
docker exec -i portfolio-mysql mysql -u root -p portfolio_db < backup.sql
```

---

## 📱 Cross-Platform Compatibility

### Windows
- Use PowerShell or Command Prompt
- Docker Desktop for Windows required
- Use `docker-compose` commands as shown above

### macOS
- Use Terminal
- Docker Desktop for Mac required
- All commands work the same as Linux

### Linux
- Install Docker Engine and Docker Compose
- May need `sudo` for Docker commands or add user to docker group:
  ```bash
  sudo usermod -aG docker $USER
  ```
- All commands work as documented

---

## 🚨 Important Notes

### Security
- Change default passwords in production
- Use environment-specific `.env` files
- Never commit `.env` files with sensitive data

### Performance
- First build may take 5-10 minutes (downloads dependencies)
- Subsequent builds are faster due to Docker layer caching
- Use `-d` flag for background operation

### Data Persistence
- Database data is stored in Docker volume `mysql_data`
- Data persists between container restarts
- Use `docker-compose down -v` only if you want to delete all data

### Ports Summary
- **5174**: Frontend (React)
- **8083**: Backend (Spring Boot)
- **3307**: MySQL Database

---

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs [service-name]`
2. Verify Docker is running: `docker info`
3. Check port availability: `netstat -an | findstr :[port]`
4. Try clean restart: `docker-compose down && docker-compose up --build`