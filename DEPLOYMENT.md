# Deployment Guide for LiveDeals Backend

This guide covers the automated deployment setup for the LiveDeals backend using GitHub Actions and DigitalOcean Droplet.

## Overview

The deployment process is fully automated through GitHub Actions. When code is pushed to the `main` branch:

1. Tests are run automatically
2. If tests pass, the application is deployed to the DigitalOcean Droplet
3. The application is restarted with zero downtime using PM2

## Prerequisites

### 1. DigitalOcean Droplet
- A running Ubuntu/Debian server on DigitalOcean
- SSH access configured
- Node.js and npm installed
- PM2 installed (or will be auto-installed)

### 2. GitHub Repository Secrets

Configure these secrets in your GitHub repository:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `DO_HOST` | Droplet IP address or hostname | `123.45.67.89` |
| `DO_USERNAME` | SSH username | `root` or `ubuntu` |
| `DO_SSH_KEY` | **PRIVATE** SSH key for authentication (not public key!) | Must include `-----BEGIN OPENSSH PRIVATE KEY-----` header and `-----END OPENSSH PRIVATE KEY-----` footer |

## Setup Instructions

### Step 1: Prepare Your Droplet

1. **Create a Droplet** on DigitalOcean with Ubuntu 22.04 or later

2. **SSH into your Droplet**:
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Node.js** (if not already installed):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs
   ```

4. **Install PM2 globally**:
   ```bash
   npm install -g pm2
   ```

5. **Create deployment directory**:
   ```bash
    mkdir -p /var/www/livedealzbackend
    chown -R ubuntu:ubuntu /var/www/livedealzbackend
   ```

6. **Set up SSH access for GitHub Actions**:
   ```bash
   # Create SSH directory
   mkdir -p /home/ubuntu/.ssh
   chmod 700 /home/ubuntu/.ssh
   
   # Generate SSH key pair (run this on your Droplet)
   ssh-keygen -t ed25519 -f /home/ubuntu/.ssh/deploy_key -C "github-actions-deploy"
   
   # Add public key to authorized_keys
   cat /home/ubuntu/.ssh/deploy_key.pub >> /home/ubuntu/.ssh/authorized_keys
   chmod 600 /home/ubuntu/.ssh/authorized_keys
   
   # Set proper permissions
   chown -R ubuntu:ubuntu /home/ubuntu/.ssh
   ```

### Step 2: Configure GitHub Secrets

1. **Get the private key**:
   ```bash
   cat /home/ubuntu/.ssh/deploy_key
   ```
   Copy the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----`)

2. **Add secrets to GitHub**:
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Secrets and variables** → **Actions**
   - Click **New repository secret**
   - Add the following secrets:
     - `DO_HOST`: Your Droplet's IP address
     - `DO_USERNAME`: `ubuntu` (or `root` if using root)
     - `DO_SSH_KEY`: The private key content from step 1

### Step 3: Configure Environment Variables

1. **Create `.env` file on your Droplet**:
   ```bash
   cd /var/www/livedealzbackend
   nano .env
   ```

2. **Add your environment variables** (example):
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL="postgresql://user:password@localhost:5432/livedeals"
   JWT_SECRET="your-jwt-secret"
   REDIS_URL="redis://localhost:6379"
   KAFKA_BROKERS="localhost:9092"
   ```

3. **Save and exit** (Ctrl+X, Y, Enter)

### Step 4: Initialize the Repository on Droplet

1. **Clone your repository** (first time only):
   ```bash
   cd /var/www/livedealzbackend
   git clone https://github.com/EVzone-Group-Dev/livedealzbackend.git .
   ```

2. **Set up git to use main branch**:
   ```bash
   git checkout main
   ```

### Step 5: Test the Deployment

1. **Push a commit to main branch**:
   ```bash
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

2. **Monitor the deployment**:
   - Go to GitHub → Actions tab
   - Watch the workflow run
   - Check for any errors

3. **Verify on Droplet**:
   ```bash
   # Check PM2 status
   pm2 status
   
   # View logs
   pm2 logs livedeals-api
   ```

## Deployment Process Details

### What Happens During Deployment

1. **GitHub Actions triggers** on push to `main` branch
2. **Test job runs**:
   - Installs dependencies
   - Runs all tests with `npm run test`
   - Fails deployment if tests fail

3. **Deploy job runs** (only if tests pass):
   - Connects to Droplet via SSH
   - Backs up `.env` and `ecosystem.config.js`
   - Pulls latest code from `main` branch
   - Cleans untracked files (except config files)
   - Installs dependencies with `npm ci`
   - Generates Prisma client
   - Builds the application
   - Restarts/reloads PM2 process

### File Preservation

The following files are **preserved** during deployment:
- `.env` - Environment variables
- `ecosystem.config.js` - PM2 configuration
- `.env.*` - Additional environment files

These files are backed up before deployment and restored afterward.

## Monitoring and Maintenance

### Check Application Status

```bash
# PM2 status
pm2 status

# Application logs
pm2 logs livedeals-api

# System resources
pm2 monit
```

### Update Dependencies

```bash
# On your local machine
npm update
npm run build

# Commit and push
git add package.json package-lock.json
git commit -m "Update dependencies"
git push origin main
```

### Rollback Deployment

```bash
# SSH into Droplet
ssh ubuntu@your-droplet-ip

cd /var/www/livedealzbackend

# Reset to previous commit
git log --oneline  # Find previous commit hash
git reset --hard <commit-hash>

# Rebuild and restart
npm ci --legacy-peer-deps
npm run build
pm2 reload ecosystem.config.js --update-env
```

## Troubleshooting

### Deployment Fails

**Check GitHub Actions logs:**
- Go to Actions tab in GitHub
- Click on the failed workflow
- Review error messages

**Common issues:**
- SSH key not configured correctly
- Droplet not accessible
- Insufficient disk space
- Permission denied errors

**SSH Key Format Error ("ssh: no key found"):**

This error occurs when the SSH key is in the wrong format or is a public key instead of a private key.

**Solution:**

1. Make sure you're using the **PRIVATE** key, not the public key
   - ❌ Wrong: `ssh-rsa AAAAB3NzaC1yc2E...` (public key)
   - ✅ Correct: `-----BEGIN OPENSSH PRIVATE KEY-----` (private key)

2. The private key must include:
   - `-----BEGIN OPENSSH PRIVATE KEY-----` header
   - The actual key content
   - `-----END OPENSSH PRIVATE KEY-----` footer

3. To generate a correct key pair:
   ```bash
   # On your local machine
   ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy"
   
   # Add public key to Droplet
   cat deploy_key.pub >> ~/.ssh/authorized_keys
   
   # Copy private key to GitHub Secrets
   cat deploy_key  # Copy this entire content
   ```

4. Add the entire private key content to GitHub Secrets as `DO_SSH_KEY`

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs livedeals-api --lines 100

# Check if port is in use
lsof -i :3000

# Check .env file exists
ls -la /var/www/livedealzbackend/.env

# Verify Prisma can connect
npx prisma db pull
```

### Tests Fail

```bash
# Run tests locally
npm run test

# Check test database connection
# Ensure test environment variables are set
```

## Security Best Practices

1. **Never commit `.env` files** to the repository
2. **Use dedicated SSH keys** for deployment
3. **Rotate SSH keys** periodically
4. **Keep dependencies updated**
5. **Use firewall rules** to restrict Droplet access
6. **Enable automatic security updates** on Droplet
7. **Monitor logs** for suspicious activity
8. **Use HTTPS** with SSL certificates

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [DigitalOcean Documentation](https://docs.digitalocean.com/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment/overview)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
