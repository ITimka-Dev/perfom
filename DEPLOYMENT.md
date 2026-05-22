# EduFarm Production Deployment Guide

This guide provides comprehensive instructions for deploying EduFarm to a production environment.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Database Setup](#database-setup)
4. [Redis Setup](#redis-setup)
5. [Backend Deployment](#backend-deployment)
6. [Frontend Deployment](#frontend-deployment)
7. [HTTPS Configuration](#https-configuration)
8. [Environment Variables](#environment-variables)
9. [Monitoring & Logging](#monitoring--logging)
10. [CI/CD Pipeline](#cicd-pipeline)
11. [Post-Deployment Checklist](#post-deployment-checklist)

---

## Prerequisites

- Ubuntu 22.04 LTS server (or similar Linux distribution)
- Domain name with DNS configured
- Root or sudo access
- Basic knowledge of Linux command line

### Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 15
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install -y postgresql-15 postgresql-contrib-15

# Install Redis
sudo apt install -y redis-server

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

---

## Infrastructure Setup

### Server Specifications (Recommended)

**Minimum for Production:**
- 2 CPU cores
- 4GB RAM
- 40GB SSD storage
- 1Gbps network

**Recommended for Production:**
- 4 CPU cores
- 8GB RAM
- 80GB SSD storage
- 1Gbps network

### Firewall Configuration

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (if exposing directly)
sudo ufw allow 3000/tcp

# Check status
sudo ufw status
```

---

## Database Setup

### PostgreSQL Configuration

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE edufarm;
CREATE USER edufarm_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE edufarm TO edufarm_user;
\q

# Configure PostgreSQL for remote connections (if needed)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Uncomment and set:
# listen_addresses = 'localhost'  # or '*' for all interfaces

# Update pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Add:
# host    edufarm    edufarm_user    127.0.0.1/32    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Database Backup Strategy

```bash
# Create backup directory
sudo mkdir -p /var/backups/postgresql
sudo chown postgres:postgres /var/backups/postgresql

# Create backup script
sudo nano /usr/local/bin/backup-edufarm-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DB_NAME="edufarm"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/edufarm_$TIMESTAMP.sql.gz"

# Create backup
sudo -u postgres pg_dump $DB_NAME | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "edufarm_*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-edufarm-db.sh

# Schedule daily backups with cron
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-edufarm-db.sh
```

---

## Redis Setup

### Redis Configuration

```bash
# Edit Redis configuration
sudo nano /etc/redis/redis.conf

# Recommended settings:
# maxmemory 256mb
# maxmemory-policy allkeys-lru
# bind 127.0.0.1
# requirepass your_redis_password_here

# Restart Redis
sudo systemctl restart redis-server

# Enable Redis on boot
sudo systemctl enable redis-server

# Test connection
redis-cli -a your_redis_password_here ping
# Should respond: PONG
```

---

## Backend Deployment

### Application Setup

```bash
# Create app directory
sudo mkdir -p /var/www/edufarm
sudo chown $USER:$USER /var/www/edufarm

# Clone repository
cd /var/www/edufarm
git clone https://github.com/your-username/edufarm.git .

# Install backend dependencies
cd backend
npm ci --production

# Create .env file
nano .env
```

### Backend Environment Variables (.env)

```env
# Server
NODE_ENV=production
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=edufarm_user
DB_PASSWORD=your_secure_password_here
DB_DATABASE=edufarm

# JWT
JWT_SECRET=your_jwt_secret_min_32_characters_long
JWT_EXPIRATION=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_here

# Supabase (for file storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

### Run Database Migrations

```bash
cd /var/www/edufarm/backend
npm run migration:run
npm run seed
```

### Build Backend

```bash
npm run build
```

### PM2 Process Management

```bash
# Start backend with PM2
pm2 start dist/main.js --name edufarm-backend -i max

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd
# Run the command that PM2 outputs

# Monitor logs
pm2 logs edufarm-backend

# Other useful PM2 commands:
# pm2 restart edufarm-backend
# pm2 stop edufarm-backend
# pm2 delete edufarm-backend
# pm2 monit
```

---

## Frontend Deployment

### Build Frontend

```bash
cd /var/www/edufarm

# Install dependencies
npm ci

# Create .env file
nano .env
```

### Frontend Environment Variables (.env)

```env
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Monitoring (Production only)
VITE_SENTRY_DSN=https://your_sentry_dsn@sentry.io/project_id
VITE_LOGROCKET_APP_ID=your_logrocket_app_id
```

```bash
# Build frontend
npm run build

# Frontend files will be in dist/ directory
```

---

## HTTPS Configuration

### Obtain SSL Certificate

```bash
# Get certificate for your domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certificate will auto-renew. Test renewal:
sudo certbot renew --dry-run
```

### Nginx Configuration

Create backend API configuration:

```bash
sudo nano /etc/nginx/sites-available/edufarm-api
```

```nginx
upstream backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # File upload limit
    client_max_body_size 10M;

    # Proxy settings
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

Create frontend configuration:

```bash
sudo nano /etc/nginx/sites-available/edufarm-frontend
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/edufarm/dist;
    index index.html;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable sites:

```bash
sudo ln -s /etc/nginx/sites-available/edufarm-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/edufarm-frontend /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Environment Variables

### Complete Environment Variables List

#### Backend (.env in backend/)

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=edufarm_user
DB_PASSWORD=<strong_password>
DB_DATABASE=edufarm

# JWT Configuration
JWT_SECRET=<min_32_characters_random_string>
JWT_EXPIRATION=7d

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=<redis_password>

# Supabase Storage
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### Frontend (.env in root/)

```env
# API Configuration
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Monitoring (Production Only)
VITE_SENTRY_DSN=https://<key>@sentry.io/<project>
VITE_LOGROCKET_APP_ID=<app_id>
```

---

## Monitoring & Logging

### Sentry Setup

1. Create account at https://sentry.io
2. Create new project (React for frontend, Node.js for backend)
3. Copy DSN and add to environment variables
4. Sentry is automatically initialized in production

### LogRocket Setup

1. Create account at https://logrocket.com
2. Create new application
3. Copy App ID and add to VITE_LOGROCKET_APP_ID
4. LogRocket is automatically initialized in production

### Application Logs

```bash
# Backend logs (PM2)
pm2 logs edufarm-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

---

## CI/CD Pipeline

### GitHub Secrets Configuration

Add these secrets to your GitHub repository (Settings → Secrets → Actions):

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<key>
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com
VITE_SENTRY_DSN=<dsn>
VITE_LOGROCKET_APP_ID=<id>
```

### Automated Deployment

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) automatically:
- Runs tests on push/PR
- Deploys to staging on push to `develop` branch
- Deploys to production on push to `main` branch

To complete deployment automation, add deployment commands in the workflow file.

Example SSH deployment:

```yaml
- name: Deploy to Production
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.PRODUCTION_HOST }}
    username: ${{ secrets.PRODUCTION_USER }}
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      cd /var/www/edufarm
      git pull origin main
      cd backend
      npm ci --production
      npm run build
      npm run migration:run
      pm2 restart edufarm-backend
      cd ..
      npm ci
      npm run build
      sudo systemctl reload nginx
```

---

## Post-Deployment Checklist

### Security

- [ ] SSL certificates installed and auto-renewal configured
- [ ] Firewall configured and enabled
- [ ] Strong passwords for database and Redis
- [ ] JWT secret is random and secure (min 32 characters)
- [ ] Security headers configured in Nginx
- [ ] Database remote access disabled (if not needed)
- [ ] Fail2ban configured for SSH protection

### Performance

- [ ] Redis caching working
- [ ] Gzip compression enabled
- [ ] Static assets cached properly
- [ ] PM2 running in cluster mode
- [ ] Database indexes created (check migrations)

### Monitoring

- [ ] Sentry error tracking active
- [ ] LogRocket session replay active
- [ ] PM2 monitoring running
- [ ] Server monitoring (CPU, RAM, disk) configured
- [ ] Database backup cron job running

### Functionality

- [ ] User registration works
- [ ] User login works
- [ ] Task creation and submission works
- [ ] Farm interactions work
- [ ] File uploads work
- [ ] WebSocket real-time updates work
- [ ] Email notifications work (if implemented)

### Testing

```bash
# Health check
curl https://api.yourdomain.com/health

# Test WebSocket
wscat -c wss://api.yourdomain.com/socket.io/?transport=websocket

# Run E2E tests against production
VITE_API_URL=https://api.yourdomain.com npm run test:e2e
```

---

## Troubleshooting

### Backend not starting

```bash
# Check logs
pm2 logs edufarm-backend

# Check if port is in use
sudo lsof -i :3000

# Restart backend
pm2 restart edufarm-backend
```

### Database connection issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U edufarm_user -d edufarm
```

### Nginx issues

```bash
# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

### Redis connection issues

```bash
# Check Redis status
sudo systemctl status redis-server

# Test connection
redis-cli -a your_redis_password ping
```

---

## Maintenance

### Update Application

```bash
cd /var/www/edufarm
git pull origin main

# Update backend
cd backend
npm ci --production
npm run build
npm run migration:run
pm2 restart edufarm-backend

# Update frontend
cd ..
npm ci
npm run build

# Reload Nginx
sudo systemctl reload nginx
```

### Database Maintenance

```bash
# Vacuum database
sudo -u postgres psql -d edufarm -c "VACUUM ANALYZE;"

# Check database size
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('edufarm'));"
```

---

## Support

For issues or questions:
- Check application logs
- Review Sentry error reports
- Consult LogRocket session replays
- Check GitHub Issues

---

**Deployment completed! 🚀**
