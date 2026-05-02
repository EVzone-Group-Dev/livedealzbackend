# 🚀 Deployment Guide

## Overview

This project uses GitHub Actions for automated deployment to DigitalOcean Droplets.

## 🔧 Droplet Requirements

### Node.js Version
- **Required**: Node.js 20+
- **Current**: Check with `node --version`

The workflow **automatically upgrades Node.js** if needed, but you can also do it manually:

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify
node --version  # Should show v20.x or higher
npm --version
```

### PM2

```bash
npm install -g pm2
pm2 --version
```

## 🔐 GitHub Secrets Setup

Configure these secrets in **Repository Settings → Secrets and variables → Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `DO_HOST` | Droplet IP address | `143.244.153.27` |
| `DO_USERNAME` | SSH username | `root` |
| `DO_SSH_KEY` | Private SSH key (contents of `key.pem`) | `-----BEGIN PRIVATE KEY-----...` |

### How to Get Your SSH Key

```bash
# If you have a key.pem file
cat key.pem

# Copy the entire output and paste as DO_SSH_SECRET
```

## 🚀 Deployment Process

### Automatic Deployment

Push to `main` branch → Tests run → Deploy to Droplet (if tests pass)

```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Manual Deployment

```bash
# SSH to Droplet
ssh root@143.244.153.27

cd /var/www/livedealzbackend

# Pull latest code
git pull origin main

# Install dependencies
npm ci --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Build
npm run build

# Restart with PM2
pm2 restart api
```

## 📁 Project Structure

```
livedealzbackend/
├── .github/workflows/
│   └── deploy-backend.yml    # GitHub Actions workflow
├── controllers/              # API controllers
├── services/                 # Business logic
├── modules/                  # NestJS modules
├── prisma/                   # Database schema
├── dist/                     # Built application
└── ecosystem.config.js       # PM2 configuration
```

## 🔍 Monitoring

### Check PM2 Status

```bash
pm2 status
pm2 logs api
```

### View Deployment Logs

GitHub Actions → Workflows → Deploy Backend

## 🛠️ Troubleshooting

### Node.js Version Issues

If you see engine warnings:

```bash
# On Droplet
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### PM2 Not Found

```bash
npm install -g pm2
```

### Deployment Fails

1. Check GitHub Actions logs
2. Verify secrets are configured
3. SSH to Droplet and check manually
4. Review PM2 logs: `pm2 logs api`

## 📝 Notes

- Tests must pass before deployment
- Concurrent deployments are prevented
- Server-specific files (.env, ecosystem.config.js) are preserved
- Zero-downtime deployment with PM2
- Auto-clones via HTTPS for public repos
