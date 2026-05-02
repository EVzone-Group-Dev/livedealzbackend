# 🔧 Nginx Setup Guide

## Overview

This guide explains how to configure Nginx as a reverse proxy for the LiveDeals API.

---

## 📁 Files

- `nginx.conf` - Nginx configuration file

---

## 🚀 Quick Setup

### Step 1: Copy Configuration

```bash
# SSH to your Droplet
ssh root@143.244.153.27

# Copy the nginx config
cp /var/www/livedealzbackend/nginx.conf /etc/nginx/sites-available/livedealzbackend
```

### Step 2: Enable the Site

```bash
# Remove default site
rm /etc/nginx/sites-enabled/default

# Enable our site
ln -s /etc/nginx/sites-available/livedealzbackend /etc/nginx/sites-enabled/
```

### Step 3: Test Configuration

```bash
nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 4: Restart Nginx

```bash
systemctl restart nginx
# or
service nginx restart
```

### Step 5: Verify

```bash
# Check nginx status
systemctl status nginx

# Test the API
curl http://localhost/health
curl http://localhost/api/health
```

---

## 🔧 Manual Configuration

### Create Nginx Config

```bash
nano /etc/nginx/sites-available/livedealzbackend
```

Paste the contents from `nginx.conf`.

### Enable the Site

```bash
ln -s /etc/nginx/sites-available/livedealzbackend /etc/nginx/sites-enabled/
```

### Remove Default Site

```bash
rm /etc/nginx/sites-enabled/default
```

### Test & Restart

```bash
nginx -t && systemctl restart nginx
```

---

## 🌐 Domain Configuration

### Update DNS

Make sure your domain points to the Droplet IP:

```
Type: A
Name: api.mylivedealz.com
Value: 143.244.153.27
TTL: 3600
```

### Update Nginx Server Name

Edit `/etc/nginx/sites-available/livedealzbackend`:

```nginx
server {
    listen 80;
    server_name api.mylivedealz.com;  # Your domain here
    ...
}
```

Restart nginx:
```bash
systemctl restart nginx
```

---

## 🔐 HTTPS Setup (Optional)

### Using Let's Encrypt

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.mylivedealz.com

# Auto-renewal is set up automatically
```

### Verify HTTPS

```bash
curl -I https://api.mylivedealz.com/health
```

---

## 🔍 Troubleshooting

### 502 Bad Gateway

**Cause**: Node.js app not running

**Fix**:
```bash
# Check PM2 status
pm2 status

# Restart app
pm2 restart api

# Check logs
pm2 logs api
```

### Nginx Default Page

**Cause**: Default site still enabled

**Fix**:
```bash
rm /etc/nginx/sites-enabled/default
systemctl restart nginx
```

### Connection Refused

**Cause**: App not listening on port 3000

**Fix**:
```bash
# Check if app is running
pm2 status

# Check port
netstat -tlnp | grep 3000

# Restart app
pm2 restart api
```

### Permission Denied

**Cause**: Nginx can't access app

**Fix**:
```bash
# Check firewall
ufw allow 'Nginx Full'
ufw allow 3000
```

---

## 📊 Monitoring

### Nginx Logs

```bash
# Access log
tail -f /var/log/nginx/livedealzbackend_access.log

# Error log
tail -f /var/log/nginx/livedealzbackend_error.log
```

### Nginx Status

```bash
systemctl status nginx
nginx -t
```

### App Status

```bash
pm2 status
pm2 logs api
```

---

## 🚀 Testing

### Health Check

```bash
curl http://localhost/health
curl http://localhost/api/health
```

Expected:
```json
{"status":"ok","timestamp":"...","uptime":...,"environment":"development"}
```

### API Test

```bash
curl http://localhost/api
```

Expected:
```
"Hello World!"
```

### Documentation

```bash
curl http://localhost/docs
```

Should show Swagger UI.

---

## 🔄 Reload After Changes

```bash
# Test config
nginx -t

# Reload (no downtime)
systemctl reload nginx

# Or restart
systemctl restart nginx
```

---

## 💡 Tips

1. **Always test config before restarting**: `nginx -t`
2. **Use reload instead of restart**: `systemctl reload nginx`
3. **Check logs for errors**: `tail -f /var/log/nginx/error.log`
4. **Enable firewall**: `ufw allow 'Nginx Full'`
5. **Set up HTTPS**: Use Let's Encrypt with certbot

---

## 📚 Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/)

---

**Need help?** Check the deployment logs or open an issue! 🚀
