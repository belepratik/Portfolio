# SECURE DEPLOYMENT GUIDE
========================

## 🔒 PASSWORD SECURITY FIXED

✅ **What Changed:**
- Removed ALL hardcoded passwords from application.properties
- Created separate profiles for local/production
- All secrets now use environment variables only

✅ **Safe for Git:**
- No passwords committed to repository
- Environment-specific configurations separated
- Production secrets managed externally

## 📁 **File Structure:**
```
application.properties          # Base config, NO secrets
application-local.properties    # Local development defaults
application-prod.properties     # Production optimizations
```

## 💻 **Local Development:**
```bash
# Set environment variables for local development
export DB_HOST=localhost
export DB_PORT=3307
export DB_USERNAME=portfolio_user
export DB_PASSWORD=portfolio_pass
export DB_NAME=portfolio_db
export CORS_ORIGINS=http://localhost:5174

# Run with local profile
java -jar target/*.jar --spring.profiles.active=local
```

## 🚀 **AWS Production:**
```bash
# Environment variables set in EC2 systemd service
Environment=DB_HOST=your-rds-endpoint.amazonaws.com
Environment=DB_USERNAME=admin
Environment=DB_PASSWORD=your-secure-password
Environment=DB_NAME=portfolio_db
Environment=CORS_ORIGINS=http://your-s3-bucket.s3-website.amazonaws.com
Environment=SERVER_PORT=8080

# Run with production profile
java -jar portfolio.jar --spring.profiles.active=prod
```

## 🛡️ **Security Benefits:**
✅ No secrets in Git repository
✅ Environment-specific configurations
✅ Production-ready security
✅ Easy to rotate passwords
✅ Audit trail of environment variables

## 🧹 **Removed Files:**
- docker-compose.yml (not needed for cloud)
- docker-commands.txt (not needed for cloud)
- aws.env (contained example secrets)

## 📋 **Next Steps:**
1. Deploy to AWS using environment variables
2. Store production secrets in AWS Systems Manager
3. Use IAM roles for enhanced security