# Automated Deployment Setup - Summary

This document summarizes the automated deployment setup for the LiveDeals backend.

## What Has Been Created

### 1. GitHub Actions Workflow
**File**: `.github/workflows/deploy-backend.yml`

This workflow automates the deployment process:
- **Trigger**: Push to `main` branch
- **Concurrency Control**: Prevents multiple simultaneous deployments
- **Two-Stage Process**:
  1. **Test Stage**: Runs all tests using `npm run test`
  2. **Deploy Stage**: Deploys to DigitalOcean Droplet via SSH (only if tests pass)

### 2. Workflow Documentation
**File**: `.github/workflows/README.md`

Detailed documentation of the workflow including:
- Required GitHub secrets
- Deployment process explanation
- Troubleshooting guide
- Security considerations

### 3. PM2 Configuration Template
**File**: `ecosystem.config.example.js`

Template for PM2 process management configuration that should be copied to `ecosystem.config.js` on the server.

### 4. Deployment Guide
**File**: `DEPLOYMENT.md`

Comprehensive deployment guide covering:
- Prerequisites
- Step-by-step setup instructions
- Monitoring and maintenance
- Troubleshooting
- Security best practices

## Quick Start

### For Repository Owner/Maintainer:

1. **Set up GitHub Secrets**:
   - Go to: Repository Settings → Secrets and variables → Actions
   - Add three secrets:
     - `DO_HOST`: Your Droplet IP address
     - `DO_USERNAME`: SSH username (e.g., `ubuntu`)
     - `DO_SSH_KEY`: Private SSH key for deployment

2. **Configure Your Droplet**:
   ```bash
   # SSH into your Droplet
   ssh ubuntu@your-droplet-ip
   
   # Install Node.js and PM2 if not already installed
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   npm install -g pm2
   
   # Create deployment directory
   mkdir -p /var/www/myaccounts
   
   # Set up SSH key for GitHub Actions
   # (See DEPLOYMENT.md for detailed instructions)
   ```

3. **Set Up Environment**:
   - Create `.env` file on the Droplet with your environment variables
   - Copy `ecosystem.config.example.js` to `ecosystem.config.js` on the server

4. **Test the Deployment**:
   - Push a commit to the `main` branch
   - Monitor the Actions tab in GitHub
   - Verify deployment on the Droplet

## How It Works

### Deployment Flow

```
Push to main branch
        ↓
GitHub Actions triggers
        ↓
[Test Stage]
  ├─ Checkout code
  ├─ Setup Node.js 20
  ├─ Install dependencies
  └─ Run tests (npm run test)
        ↓
  Tests pass? ──No──→ Stop deployment
        ↓ Yes
[Deploy Stage]
  ├─ Connect via SSH to Droplet
  ├─ Backup .env and ecosystem.config.js
  ├─ Pull latest code from main
  ├─ Install dependencies (npm ci)
  ├─ Generate Prisma client
  ├─ Build application (npm run build)
  └─ Restart/reload PM2
        ↓
Deployment complete!
```

### Key Features

✅ **Automatic Testing**: Tests run before every deployment  
✅ **Safe Rollbacks**: Failed tests prevent deployment  
✅ **Concurrent Deployment Prevention**: Only one deployment at a time  
✅ **Zero-Downtime**: PM2 reloads without dropping connections  
✅ **Config Preservation**: Server-specific files are protected  
✅ **Security**: Minimal permissions, SSH key authentication  

## Files Modified/Created

```
livedeals-api/
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml      # Main workflow file (NEW)
│       └── README.md               # Workflow documentation (NEW)
├── ecosystem.config.example.js     # PM2 config template (NEW)
├── DEPLOYMENT.md                   # Deployment guide (NEW)
└── SETUP_AUTOMATED_DEPLOYMENT.md   # This file (NEW)
```

## Testing the Setup

1. Make a small change to your code
2. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Test automated deployment"
   git push origin main
   ```
3. Watch the deployment in GitHub Actions
4. Verify the application is running:
   ```bash
   ssh ubuntu@your-droplet-ip
   pm2 status
   ```

## Need Help?

Refer to the detailed documentation:
- **Workflow details**: `.github/workflows/README.md`
- **Deployment guide**: `DEPLOYMENT.md`
- **PM2 configuration**: `ecosystem.config.example.js`

## Important Notes

- The workflow uses Node.js 20 (matching your `package.json`)
- Tests must pass before deployment proceeds
- The deployment directory is `/var/www/myaccounts`
- PM2 is used for process management
- Prisma client is regenerated on each deployment
- The application is built before deployment

## Security Reminders

🔒 Never commit `.env` files to the repository  
🔒 Keep your SSH keys secure  
🔒 Rotate deployment keys periodically  
🔒 Monitor deployment logs regularly  
🔒 Keep dependencies updated  

## Next Steps

After setup is complete:

1. [ ] Configure GitHub Secrets
2. [ ] Set up Droplet with required software
3. [ ] Create `.env` file on server
4. [ ] Test deployment with a sample commit
5. [ ] Set up monitoring/alerting (optional)
6. [ ] Configure SSL certificates (optional)
7. [ ] Set up database backups (optional)
8. [ ] Configure log rotation (optional)

---

**Setup completed**: Ready for deployment! 🚀
