# GitHub Actions Workflow - Backend Deployment

This directory contains the GitHub Actions workflow for automated deployment of the LiveDeals backend to DigitalOcean Droplet.

## Workflow Overview

The `deploy-backend.yml` workflow automates the following process:

1. **Test Job**: Runs on every push to the `main` branch
   - Checks out the repository
   - Sets up Node.js 20
   - Installs dependencies
   - Runs all tests

2. **Deploy Job**: Runs only after tests pass
   - Connects to DigitalOcean Droplet via SSH
   - Pulls latest code from the repository
   - Installs dependencies
   - Generates Prisma client
   - Builds the NestJS application
   - Restarts the application using PM2

## Features

- **Concurrent Deployment Prevention**: Uses GitHub Actions concurrency groups to prevent multiple deployments from running simultaneously
- **Security Best Practices**: Minimal permissions (read-only for contents)
- **Test-First Deployment**: Deployment only proceeds if all tests pass
- **Safe Deployment**: Backs up server-specific files (`.env`, `ecosystem.config.js`) before deployment and restores them after
- **PM2 Process Management**: Uses PM2 for zero-downtime reloads

## Required GitHub Secrets

You need to configure the following secrets in your GitHub repository:

### 1. `DO_HOST`
- **Description**: The IP address or hostname of your DigitalOcean Droplet
- **Example**: `123.45.67.89` or `my-droplet.example.com`

### 2. `DO_USERNAME`
- **Description**: SSH username for your Droplet
- **Example**: `root` or `ubuntu`

### 3. `DO_SSH_KEY`
- **Description**: Private SSH key for authentication
- **How to generate**:
  ```bash
  ssh-keygen -t ed25519 -f deploy_key -C "github-actions-deploy"
  ```
- **Setup**:
  1. Add the public key (`deploy_key.pub`) to `~/.ssh/authorized_keys` on your Droplet
  2. Copy the **entire** private key including the header and footer:
     ```
     -----BEGIN OPENSSH PRIVATE KEY-----
     b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
     NhAAAAAwEAAQAAAYEAn3...
     -----END OPENSSH PRIVATE KEY-----
     ```
  3. Add this entire content as the GitHub secret value
  
**Important**: The key must include:
- `-----BEGIN OPENSSH PRIVATE KEY-----` header
- The actual key content  
- `-----END OPENSSH PRIVATE KEY-----` footer
- Proper line breaks (use `\n` in the secret if needed)

**Troubleshooting**: If you see "ssh: no key found" error:
- Make sure the key includes the BEGIN/END headers
- Check for extra spaces or missing line breaks
- Verify the key format is OpenSSH format (not PEM)

## Deployment Directory

The workflow deploys to `/var/www/livedealzbackend` on the Droplet. Make sure:
- The directory exists
- The SSH user has write permissions
- Node.js and npm are installed
- PM2 is available (will be auto-installed if not present)

## Server-Specific Files

The following files are preserved during deployment:
- `ecosystem.config.js` - PM2 configuration
- `.env` - Environment variables
- `.env.*` - Additional environment files

These files are backed up before deployment and restored afterward to prevent overwriting sensitive configuration.

## Manual Deployment

To trigger a manual deployment without pushing code:

```bash
# SSH into your Droplet
ssh user@your-droplet-ip

# Navigate to the deployment directory
cd /var/www/livedealzbackend

# Pull latest changes
git pull origin main

# Install dependencies
npm ci --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Build the application
npm run build

# Restart with PM2
pm2 reload ecosystem.config.js --update-env
```

## Monitoring

After deployment, you can monitor your application:

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs api

# Monitor application
pm2 monit
```

## Troubleshooting

### Tests Fail
- Check the Actions tab in GitHub for detailed error logs
- Ensure all dependencies are properly installed
- Verify test database is accessible (if using external DB)

### Deployment Fails
- Verify SSH key is correctly configured in GitHub Secrets
- Ensure Droplet is accessible from GitHub Actions IPs
- Check disk space on Droplet: `df -h`
- Verify Node.js version compatibility

### Application Won't Start
- Check PM2 logs: `pm2 logs api`
- Verify `.env` file exists and has correct values
- Ensure Prisma migrations are up to date: `npx prisma migrate deploy`
- Check port availability: `lsof -i :3000`

## Security Considerations

1. **SSH Key**: Use a dedicated deploy key with no other access
2. **Environment Variables**: Never commit `.env` files to the repository
3. **Permissions**: The workflow uses minimal required permissions
4. **Secrets**: Rotate SSH keys periodically
5. **Firewall**: Configure Droplet firewall to allow only necessary ports

## Workflow File Structure

```
livedeals-api/
├── .github/
│   └── workflows/
│       ├── deploy-backend.yml  # Main deployment workflow
│       └── README.md           # This file
└── ...
```
