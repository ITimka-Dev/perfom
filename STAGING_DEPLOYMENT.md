# Staging Environment Setup Guide

This guide explains how to set up and maintain a staging environment for EduFarm that mirrors production.

## Purpose of Staging

Staging environment allows you to:
- Test changes in a production-like environment
- Validate deployments before production
- Perform integration testing with real data
- Demo features to stakeholders
- Train users on upcoming features

## Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Developer     │      │     Staging     │      │   Production    │
│   Local Env     │─────▶│   Environment   │─────▶│  Environment    │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                         │                         │
        │                         │                         │
     develop                 develop branch            main branch
     branch                  auto-deploys            auto-deploys
```

## Infrastructure Requirements

### Minimum Specs (Cost-Optimized)
- 2 CPU cores
- 2GB RAM
- 20GB SSD storage
- 1Gbps network

### Recommended (Better Performance)
- 2 CPU cores
- 4GB RAM
- 40GB SSD storage
- 1Gbps network

## Setup Steps

### 1. Server Provisioning

```bash
# SSH into your staging server
ssh user@staging.yourdomain.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install required software (same as production)
# Follow steps from DEPLOYMENT.md
```

### 2. DNS Configuration

Add DNS records:
```
staging.yourdomain.com       → Your staging server IP
api-staging.yourdomain.com   → Your staging server IP
```

### 3. Database Setup

```bash
# Create staging database
sudo -u postgres psql
CREATE DATABASE edufarm_staging;
CREATE USER edufarm_staging WITH ENCRYPTED PASSWORD 'staging_password';
GRANT ALL PRIVILEGES ON DATABASE edufarm_staging TO edufarm_staging;
\q

# Optionally, copy production data (sanitized)
# See "Data Management" section below
```

### 4. Environment Configuration

Create staging environment files:

**Frontend (.env.staging)**
```env
VITE_API_URL=https://api-staging.yourdomain.com
VITE_WS_URL=wss://api-staging.yourdomain.com
VITE_SENTRY_DSN=https://staging_sentry_dsn@sentry.io/staging_project
VITE_LOGROCKET_APP_ID=staging_logrocket_id
VITE_ENABLE_DEBUG_MODE=true
```

**Backend (backend/.env.staging)**
```env
NODE_ENV=staging
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=edufarm_staging
DB_PASSWORD=staging_password
DB_DATABASE=edufarm_staging
JWT_SECRET=staging_jwt_secret_32_chars_minimum
REDIS_HOST=localhost
REDIS_PORT=6379
SUPABASE_URL=https://staging-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=staging_service_key
```

### 5. Application Deployment

```bash
# Clone repository
cd /var/www
sudo mkdir edufarm-staging
sudo chown $USER:$USER edufarm-staging
cd edufarm-staging
git clone https://github.com/your-org/edufarm.git .
git checkout develop

# Install backend
cd backend
npm ci
npm run build
npm run migration:run

# Start with PM2
pm2 start dist/main.js --name edufarm-backend-staging

# Install frontend
cd ..
npm ci
npm run build
```

### 6. Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/edufarm-staging
```

```nginx
# Backend API
upstream staging-backend {
    server 127.0.0.1:3001;
}

server {
    listen 80;
    server_name api-staging.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api-staging.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api-staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-staging.yourdomain.com/privkey.pem;

    add_header X-Environment "staging" always;
    
    location / {
        proxy_pass http://staging-backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Frontend
server {
    listen 80;
    server_name staging.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name staging.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.yourdomain.com/privkey.pem;

    root /var/www/edufarm-staging/dist;
    index index.html;

    add_header X-Environment "staging" always;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Enable and test:
```bash
sudo ln -s /etc/nginx/sites-available/edufarm-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. SSL Certificate

```bash
sudo certbot --nginx -d staging.yourdomain.com -d api-staging.yourdomain.com
```

## Data Management

### Sanitizing Production Data for Staging

**Never copy raw production data to staging.** Always sanitize:

```bash
# Export production data
pg_dump -U edufarm_user -h production-db edufarm > prod_dump.sql

# Sanitize sensitive data
cat prod_dump.sql | sed 's/real-email@/test-email@/g' > staging_dump.sql

# Or use a script
python sanitize_data.py prod_dump.sql > staging_dump.sql

# Import to staging
psql -U edufarm_staging -d edufarm_staging < staging_dump.sql
```

### Seed Data for Staging

Use test data generators:

```bash
cd backend
npm run seed -- --env=staging
```

### Reset Staging Data

```bash
# Drop and recreate database
sudo -u postgres psql
DROP DATABASE edufarm_staging;
CREATE DATABASE edufarm_staging;
GRANT ALL PRIVILEGES ON DATABASE edufarm_staging TO edufarm_staging;
\q

# Re-run migrations and seeds
cd /var/www/edufarm-staging/backend
npm run migration:run
npm run seed
```

## GitHub Actions Configuration

### Required Secrets

Add to GitHub Settings → Secrets → Actions:

**Staging-Specific Secrets:**
```
STAGING_HOST=staging.yourdomain.com
STAGING_USER=deploy
STAGING_SSH_KEY=<private_ssh_key>
STAGING_API_URL=https://api-staging.yourdomain.com
STAGING_WS_URL=wss://api-staging.yourdomain.com
STAGING_SENTRY_DSN=<staging_sentry_dsn>
STAGING_LOGROCKET_APP_ID=<staging_logrocket_id>
```

### Deployment Workflow

Automatic deployment on push to `develop` branch:

```yaml
# .github/workflows/ci-cd.yml
deploy-staging:
  runs-on: ubuntu-latest
  needs: [e2e-test]
  if: github.ref == 'refs/heads/develop'
  
  steps:
    - name: Deploy to Staging
      # ... deployment steps
```

### Manual Deployment

Trigger via GitHub Actions UI:
1. Go to Actions tab
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select `develop` branch

## Testing in Staging

### Smoke Tests

After deployment, run automated checks:

```bash
# Health check
curl https://api-staging.yourdomain.com/health

# Basic functionality
npm run test:staging
```

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Task creation and submission
- [ ] Farm interactions
- [ ] Real-time WebSocket updates
- [ ] File uploads
- [ ] Email notifications (if enabled)
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Load Testing

```bash
# Install k6
sudo apt install k6

# Run load test
k6 run load-tests/staging.js
```

## Monitoring

### Sentry (Staging Project)

Create separate Sentry project for staging:
- Name: "EduFarm Staging"
- Alert rules: Lower priority than production
- Sample rate: 100% (capture all errors)

### LogRocket (Staging App)

Create separate LogRocket app:
- Name: "EduFarm Staging"
- Session replay: All sessions
- Network capture: Enabled

### Uptime Monitoring

Add staging to uptime monitor:
```
Monitor URL: https://api-staging.yourdomain.com/health
Check interval: 5 minutes
Alert: Email only (not Slack/PagerDuty)
```

## Maintenance

### Weekly Tasks

- [ ] Review and clear logs
- [ ] Check disk space
- [ ] Review error reports
- [ ] Sync with latest production data (sanitized)

### Monthly Tasks

- [ ] Update dependencies
- [ ] Security patches
- [ ] Database optimization
- [ ] Backup verification

### Before Major Releases

1. **Sync Data**: Refresh with sanitized production data
2. **Test Migrations**: Run database migrations
3. **Performance Test**: Load testing
4. **Security Scan**: Run security audit
5. **Stakeholder Demo**: Show new features

## Cost Optimization

### Resource Sharing

Share resources with development:
- Use same Redis instance (different DB)
- Share Supabase project (different buckets)
- Use lower-tier monitoring plans

### Scheduled Shutdown

If rarely used, schedule shutdown during off-hours:

```bash
# Crontab: Shutdown at 8 PM
0 20 * * * pm2 stop edufarm-backend-staging

# Crontab: Start at 8 AM
0 8 * * * pm2 start edufarm-backend-staging
```

### Auto-Scaling

Use smaller resources, scale up for testing:
```bash
# During testing
pm2 scale edufarm-backend-staging 4

# After testing
pm2 scale edufarm-backend-staging 1
```

## Troubleshooting

### Staging is Down

```bash
# Check backend
pm2 status
pm2 logs edufarm-backend-staging

# Check Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log

# Check database
sudo systemctl status postgresql
```

### Deployment Failed

```bash
# SSH into staging
ssh deploy@staging.yourdomain.com

# Check recent logs
pm2 logs edufarm-backend-staging --lines 100

# Manual deployment
cd /var/www/edufarm-staging
git pull origin develop
cd backend && npm ci && npm run build
pm2 restart edufarm-backend-staging
```

### Health Check Failing

```bash
# Test endpoint
curl -v https://api-staging.yourdomain.com/health

# Check individual services
curl https://api-staging.yourdomain.com/health/database
curl https://api-staging.yourdomain.com/health/redis
curl https://api-staging.yourdomain.com/health/storage
```

## Best Practices

### ✅ DO

- Keep staging as close to production as possible
- Use separate Sentry/LogRocket projects
- Sanitize all production data before copying
- Test every deployment in staging first
- Use staging for demos and training
- Automate deployments via CI/CD

### ❌ DON'T

- Use production API keys in staging
- Copy raw production data with PII
- Skip staging for "small" changes
- Use staging as development environment
- Ignore staging failures
- Allow untested code in staging

## Migration Path: Staging → Production

### 1. Validate in Staging

- [ ] All tests pass
- [ ] Manual testing complete
- [ ] Performance acceptable
- [ ] Security scan clean
- [ ] Stakeholder approval

### 2. Prepare Production

- [ ] Schedule maintenance window
- [ ] Notify users
- [ ] Backup production database
- [ ] Prepare rollback plan

### 3. Deploy to Production

```bash
# Merge develop to main
git checkout main
git merge develop
git push origin main

# Auto-deploys via GitHub Actions
# Monitor deployment in Actions tab
```

### 4. Post-Deployment

- [ ] Health check passes
- [ ] Smoke tests pass
- [ ] Monitor error rates
- [ ] User feedback
- [ ] Update documentation

## Resources

- [Main Deployment Guide](DEPLOYMENT.md)
- [Visual Testing Guide](VISUAL_TESTING.md)
- [E2E Testing](e2e/README.md)

---

**Questions?** Contact DevOps team or check internal wiki.
