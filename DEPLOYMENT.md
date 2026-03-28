# 🚀 Prescripto Deployment Guide

## Render Deployment Steps

### Prerequisites

- GitHub repository with your code
- Render account (free tier available)
- PostgreSQL database (Render provides this)

### Step 1: Prepare Your Repository

1. Ensure all code is committed and pushed to GitHub
2. Verify your `package.json` has correct scripts
3. Check that `dist/` folder is built (or will be built during deployment)

### Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 3: Create PostgreSQL Database

1. In Render dashboard, click "New +"
2. Select "PostgreSQL"
3. Choose "Starter" plan (free)
4. Name it: `prescripto-database`
5. Click "Create Database"
6. Wait for database to be created
7. Note down the connection details:
   - Host
   - Port
   - Database Name
   - Username
   - Password

### Step 4: Deploy Web Service

1. In Render dashboard, click "New +"
2. Select "Web Service"
3. Connect your GitHub repository
4. Choose your repository: `prescripto`
5. Configure the service:
   - **Name**: `prescripto-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Starter` (free)

### Step 5: Configure Environment Variables

In your web service settings, add these environment variables:

#### Required Variables:

```
NODE_ENV=production
PORT=10000
DB_HOST=<your_render_db_host>
DB_PORT=5432
DB_NAME=<your_render_db_name>
DB_USER=<your_render_db_user>
DB_PASSWORD=<your_render_db_password>
DB_DIALECT=postgres
JWT_SECRET=<your_super_secret_jwt_key>
JWT_EXPIRES_IN=24h
QR_ENCRYPTION_KEY=<your_qr_encryption_key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=<your_email@gmail.com>
SMTP_PASS=<your_app_password>
FRONTEND_URL=https://your-frontend-domain.com
```

#### Optional Variables:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

### Step 6: Deploy

1. Click "Create Web Service"
2. Wait for deployment to complete
3. Check logs for any errors
4. Test your endpoints

### Step 7: Verify Deployment

1. Check health endpoint: `https://your-app.onrender.com/health`
2. Check API docs: `https://your-app.onrender.com/api/v1/docs`
3. Test authentication: `https://your-app.onrender.com/api/v1/auth/login`

### Step 8: Database Migration

The database migrations will run automatically when the server starts. If you need to run them manually:

1. Go to your web service dashboard
2. Click "Shell"
3. Run: `npm run migrate`

### Troubleshooting

#### Common Issues:

1. **Build Fails**: Check Node.js version (should be 18+)
2. **Database Connection**: Verify environment variables
3. **Port Issues**: Ensure PORT is set to 10000
4. **Migration Errors**: Check database permissions

#### Logs:

- View logs in Render dashboard
- Check build logs for compilation errors
- Check runtime logs for runtime errors

### Security Notes:

1. Change all default passwords
2. Use strong JWT secrets
3. Use strong QR encryption keys
4. Enable HTTPS (automatic on Render)
5. Set up proper CORS for production

### Monitoring:

- Health check endpoint: `/health`
- API documentation: `/api/v1/docs`
- Monitor logs in Render dashboard

### Scaling:

- Upgrade to paid plans for better performance
- Add Redis for session management
- Use CDN for static files
- Implement proper logging and monitoring

## Environment Variables Reference

| Variable          | Description        | Example              |
| ----------------- | ------------------ | -------------------- |
| NODE_ENV          | Environment        | production           |
| PORT              | Server port        | 10000                |
| DB_HOST           | Database host      | your-db.onrender.com |
| DB_PORT           | Database port      | 5432                 |
| DB_NAME           | Database name      | prescripto_db        |
| DB_USER           | Database user      | prescripto_user      |
| DB_PASSWORD       | Database password  | your_password        |
| JWT_SECRET        | JWT signing key    | your_secret_key      |
| QR_ENCRYPTION_KEY | QR code encryption | your_qr_key          |
| SMTP_USER         | Email username     | your_email@gmail.com |
| SMTP_PASS         | Email password     | your_app_password    |
| FRONTEND_URL      | Frontend URL       | https://your-app.com |

# MedConnect API - Subdomain Deployment Guide

This guide will help you deploy your API to a subdomain like `api.yourdomain.com`

## Prerequisites

- A domain name (e.g., `yourdomain.com`)
- A server with Ubuntu/Debian (VPS from DigitalOcean, Linode, AWS, etc.)
- SSH access to your server
- Node.js 18+ and npm installed on server

---

## Step 1: Set Up Your Server

### 1.1 SSH into your server

```bash
ssh root@your-server-ip
# or
ssh username@your-server-ip
```

### 1.2 Update system packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js 18+ (if not installed)

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### 1.4 Install PostgreSQL (if not installed)

```bash
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
```

Inside PostgreSQL prompt:

```sql
CREATE DATABASE prescripto_db;
CREATE USER postgres WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE prescripto_db TO postgres;
\q
```

### 1.5 Install PM2 globally

```bash
sudo npm install -g pm2
```

---

## Step 2: Deploy Your Application

### 2.1 Clone your repository

```bash
cd /var/www
sudo mkdir -p medconnect
sudo chown -R $USER:$USER medconnect
cd medconnect

# Clone your repo
git clone https://github.com/yourusername/your-repo.git .
```

### 2.2 Install dependencies

```bash
npm install
```

### 2.3 Create production .env file

```bash
nano .env
```

Paste your production environment variables (update values):

```properties
# Server Configuration
NODE_ENV=production
PORT=3300
HOST=localhost

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=prescripto_db
DB_USER=postgres
DB_PASSWORD=your_secure_production_password
DB_DIALECT=postgres

# JWT Configuration (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your_very_long_random_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=medconnect250@gmail.com
SMTP_PASS=your_app_specific_password
FRONTEND_URL=https://yourdomain.com

# QR Code Configuration
QR_EXPIRY_HOURS=72
QR_SECRET_KEY=your_qr_secret_key

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Backup Configuration
BACKUP_PATH=./backups
BACKUP_RETENTION_DAYS=30
```

Press `CTRL+X`, then `Y`, then `ENTER` to save.

### 2.4 Create necessary directories

```bash
mkdir -p logs backups
```

### 2.5 Build the application

```bash
npm run build
```

### 2.6 Run database migrations

```bash
npm run db:migrate
```

### 2.7 Start with PM2

```bash
pm2 start ecosystem.config.ts --env production
pm2 save
pm2 startup
# Copy and run the command it gives you
```

---

## Step 3: Configure Nginx as Reverse Proxy

### 3.1 Install Nginx

```bash
sudo apt install nginx -y
```

### 3.2 Create Nginx configuration for subdomain

```bash
sudo nano /etc/nginx/sites-available/api.yourdomain.com
```

Paste this configuration:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Request size limit (for file uploads)
    client_max_body_size 10M;

    # Logging
    access_log /var/log/nginx/medconnect-access.log;
    error_log /var/log/nginx/medconnect-error.log;

    location / {
        proxy_pass http://localhost:3300;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Disable cache for API
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint (optional)
    location /health {
        proxy_pass http://localhost:3300/health;
        access_log off;
    }
}
```

### 3.3 Enable the site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Step 4: Configure DNS

### 4.1 Add A Record or CNAME

Go to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):

**Option A: A Record (Direct to IP)**

```
Type: A
Name: api
Value: your.server.ip.address
TTL: 3600 (or Auto)
```

**Option B: CNAME (if main domain points to server)**

```
Type: CNAME
Name: api
Value: yourdomain.com
TTL: 3600 (or Auto)
```

Wait 5-60 minutes for DNS propagation.

---

## Step 5: Set Up SSL Certificate (HTTPS)

### 5.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 5.2 Obtain SSL certificate

```bash
sudo certbot --nginx -d api.yourdomain.com
```

Follow the prompts:

- Enter your email
- Agree to terms
- Choose whether to redirect HTTP to HTTPS (recommended: Yes)

### 5.3 Test auto-renewal

```bash
sudo certbot renew --dry-run
```

---

## Step 6: Configure Firewall

```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow PostgreSQL (only if needed externally)
# sudo ufw allow 5432/tcp

# Enable firewall
sudo ufw enable
```

---

## Step 7: Verify Deployment

### 7.1 Check PM2 status

```bash
pm2 list
pm2 logs medconnect-api
```

### 7.2 Test your API

```bash
# Health check
curl https://api.yourdomain.com/health

# API endpoint
curl https://api.yourdomain.com/api/v1
```

---

## Maintenance Commands

### Update application

```bash
cd /var/www/medconnect
git pull
npm install
npm run build
npm run db:migrate
pm2 restart medconnect-api
```

### View logs

```bash
# PM2 logs
pm2 logs medconnect-api

# Nginx logs
sudo tail -f /var/log/nginx/medconnect-error.log
sudo tail -f /var/log/nginx/medconnect-access.log

# Application logs
tail -f logs/app.log
```

### Monitor performance

```bash
pm2 monit
```

### Restart services

```bash
# Restart API
pm2 restart medconnect-api

# Restart Nginx
sudo systemctl restart nginx

# Restart PostgreSQL
sudo systemctl restart postgresql
```

---

## Troubleshooting

### API not starting

```bash
pm2 logs medconnect-api --lines 100
# Check for errors in the logs
```

### Database connection issues

```bash
# Test PostgreSQL connection
psql -U postgres -d prescripto_db -h localhost

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

### Nginx errors

```bash
# Test Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### DNS not resolving

```bash
# Check DNS propagation
nslookup api.yourdomain.com
dig api.yourdomain.com
```

### SSL certificate issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

---

## Security Checklist

- ✅ Strong passwords for database and JWT secrets
- ✅ Firewall configured (UFW)
- ✅ SSL/HTTPS enabled
- ✅ Environment variables secured (.env not in git)
- ✅ Rate limiting enabled in your API
- ✅ Regular backups configured
- ✅ Keep server updated: `sudo apt update && sudo apt upgrade`

---

## Quick Reference

**API URL:** `https://api.yourdomain.com`
**Docs URL:** `https://api.yourdomain.com/api/v1/docs`
**Health Check:** `https://api.yourdomain.com/health`

**Server Location:** `/var/www/medconnect`
**PM2 Logs:** `~/.pm2/logs/`
**Nginx Config:** `/etc/nginx/sites-available/api.yourdomain.com`
**Application Logs:** `/var/www/medconnect/logs/`
