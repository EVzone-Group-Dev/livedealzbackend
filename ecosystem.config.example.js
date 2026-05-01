/**
 * PM2 Ecosystem Configuration File
 * 
 * This file configures PM2 to manage your NestJS application.
 * Copy this file to ecosystem.config.js on your server and customize it.
 * 
 * IMPORTANT: Do NOT commit ecosystem.config.js to git (it's in .gitignore)
 * This is a template file for reference.
 */

module.exports = {
    apps: [{
        name: 'livedeals-api',
        script: './dist/main.js',
        instances: 1,
        exec_mode: 'fork',
        autorestart: true,
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'production',
            PORT: 3000,
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
        },
        // Uncomment and configure if using PM2+ for monitoring
        // merge_logs: true,
        // log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        // error_file: './logs/err.log',
        // out_file: './logs/out.log',
        // log_file: './logs/combined.log',
        // time: true
    }]
};
