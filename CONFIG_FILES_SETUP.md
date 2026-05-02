# 📄 Configuration Files Setup Guide

## Overview

This guide explains how to create the required configuration files for deployment.

---

## 📁 Files to Create

### 1. `ecosystem.config.js` - PM2 Configuration

**Purpose**: Configures PM2 for zero-downtime deployment

**Location**: `/var/www/livedealzbackend/ecosystem.config.js`

**How to Create**:

#### Option A: Copy from this repository (Recommended)

The file already exists in the repository:
```bash
# On your local machine
git add ecosystem.config.js
git commit -m "Add PM2 config"
git push origin main

# The workflow will automatically use it
```

#### Option B: Create manually on Droplet

```bash
# SSH to your Droplet
ssh root@143.244.153.27

cd /var/www/livedealzbackend

# Create the file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: './dist/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      merge_logs: true,
    },
  ],
};
EOF

# Verify
cat ecosystem.config.js
```

#### Option C: Use the example file

```bash
cp ecosystem.config.example.js ecosystem.config.js
```

**What it does**:
- Runs your app in cluster mode (uses all CPU cores)
- Auto-restarts on crashes
- Zero-downtime reloads
- Memory limit: 1GB per instance
- Logs to `/var/log/pm2/`

---

### 2. `.env` - Environment Variables

**Purpose**: Stores sensitive configuration (database, API keys, etc.)

**Location**: `/var/www/livedealzbackend/.env`

**⚠️ IMPORTANT**: Never commit this file to Git!

**How to Create**:

#### Option A: Create from example

```bash
# On your local machine
cp .env.example .env

# Edit .env with your values
nano .env  # or use any text editor

# IMPORTANT: Add .env to .gitignore if not already there
echo ".env" >> .git/info/exclude
```

#### Option B: Create manually on Droplet

```bash
# SSH to your Droplet
ssh root@143.244.153.27

cd /var/www/livedealzbackend

# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/livedeals
JWT_SECRET=your-secret-key-here-change-this
REDIS_HOST=localhost
REDIS_PORT=6379
EOF

# Verify
cat .env
```

#### Option C: Use the deployment workflow (Automatic)

The workflow automatically:
1. Backs up existing `.env` before deployment
2. Restores it after deployment
3. Never overwrites it

**Just make sure it exists before first deployment!**

---

## 🔧 Required Environment Variables

### Minimum Required for Basic Operation

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/livedeals

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-this

# Redis (for caching/sessions)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Optional (Add as needed)

```bash
# LiveKit (video streaming)
LIVEKIT_URL=https://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

# AWS S3 (media storage)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name

# SMTP (email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

---

## 🛡️ Security Best Practices

### 1. Never Commit `.env` to Git

```bash
# Add to .gitignore or .git/info/exclude
echo ".env" >> .git/info/exclude
```

### 2. Use Strong Secrets

```bash
# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Output: a6b7c8d9e0f1... (use this as JWT_SECRET)
```

### 3. Restrict File Permissions

```bash
# On Droplet
chmod 600 .env
chown root:root .env
```

### 4. Use Different Secrets per Environment

```bash
# Development
.env.development

# Production
.env.production
```

---

## 🚀 Quick Setup

### Step 1: Create `.env`

```bash
cd /var/www/livedealzbackend
cp .env.example .env
nano .env  # Edit with your values
```

### Step 2: Verify `ecosystem.config.js`

```bash
# It should already exist
ls -la ecosystem.config.js

# If not, create it
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'api',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
  }],
};
EOF
```

### Step 3: Test Configuration

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs api
```

### Step 4: Save PM2 Process List

```bash
# Save current processes
pm2 save

# Setup startup script (runs on server restart)
pm2 startup
```

---

## 🔄 Workflow Behavior

### During Deployment

The workflow:

1. **Backs up** existing files:
   ```bash
   cp .env /tmp/livedealzbackend.env
   cp ecosystem.config.js /tmp/ecosystem.config.js
   ```

2. **Pulls** latest code

3. **Restores** files:
   ```bash
   mv /tmp/livedealzbackend.env .env
   mv /tmp/ecosystem.config.js ecosystem.config.js
   ```

4. **Never overwrites** your `.env` or `ecosystem.config.js`

### First Deployment

If files don't exist:
- Workflow will still work
- Creates them on first run
- You can add them later

---

## 📋 Checklist

- [ ] `ecosystem.config.js` created
- [ ] `.env` created with required variables
- [ ] `.env` added to `.git/info/exclude`
- [ ] Database URL configured
- [ ] JWT secret is strong
- [ ] PM2 can read the files
- [ ] File permissions are secure (600 for .env)

---

## ❓ Troubleshooting

### PM2 Can't Find `dist/main.js`

**Cause**: Build hasn't been run yet

**Fix**:
```bash
npm run build
pm2 start ecosystem.config.js
```

### Environment Variables Not Loading

**Cause**: `.env` file not in correct location

**Fix**:
```bash
# Check location
pwd  # Should be /var/www/livedealzbackend
ls -la .env
```

### Database Connection Failed

**Cause**: Wrong `DATABASE_URL` in `.env`

**Fix**:
```bash
# Test connection
npx prisma db pull

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Prisma Environment Variables](https://www.prisma.io/docs/orm/overview/prisma-client-environment-variables)
- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)

---

## 💡 Pro Tips

1. **Use `dotenv` for local development**
   ```bash
   npm install dotenv
   ```

2. **Encrypt secrets for team sharing**
   ```bash
   # Use tools like ansible-vault or sops
   ```

3. **Rotate secrets regularly**
   ```bash
   # Change JWT_SECRET, database passwords, etc.
   ```

4. **Monitor with PM2**
   ```bash
   pm2 monit  # Real-time monitoring
   ```

---

**Need help?** Check the other documentation files or open an issue! 🚀
