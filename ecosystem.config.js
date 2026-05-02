/**
 * PM2 Ecosystem Configuration File
 * 
 * This file configures PM2 for zero-downtime deployment.
 * 
 * Copy this to your Droplet at /var/www/livedealzbackend/ecosystem.config.js
 * Or the workflow will create it automatically on first deployment.
 */

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
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/api-error.log',
      out_file: '/var/log/pm2/api-out.log',
      merge_logs: true,
    },
  ],
};
