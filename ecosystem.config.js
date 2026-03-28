module.exports = {
  apps: [
    {
      name: "medconnect-api",
      script: "./dist/scripts/startup.js",
      instances: 1, // Change to 'max' for clustering with all CPU cores
      exec_mode: "fork", // Change to 'cluster' if using multiple instances
      autorestart: true,
      watch: false, // Set to true only in development if you want auto-restart on file changes
      max_memory_restart: "500M", // Restart if memory exceeds 500MB

      // Environment variables
      env_production: {
        NODE_ENV: "production",
        PORT: 3300,
        HOST: "localhost",
        DB_DIALECT: "postgres",
        JWT_EXPIRES_IN: "24h",
        JWT_REFRESH_EXPIRES_IN: "7d",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        BCRYPT_ROUNDS: "12",
        RATE_LIMIT_WINDOW_MS: "900000",
        RATE_LIMIT_MAX_REQUESTS: "100",
        QR_EXPIRY_HOURS: "72",
        LOG_LEVEL: "info",
        LOG_FILE_PATH: "./logs/app.log",
        BACKUP_PATH: "./backups",
        BACKUP_RETENTION_DAYS: "30",
      },

      env_development: {
        NODE_ENV: "development",
        PORT: 3300,
        HOST: "localhost",
        DB_DIALECT: "postgres",
        JWT_EXPIRES_IN: "24h",
        JWT_REFRESH_EXPIRES_IN: "7d",
        SMTP_PORT: "587",
        SMTP_SECURE: "false",
        BCRYPT_ROUNDS: "12",
        RATE_LIMIT_WINDOW_MS: "900000",
        RATE_LIMIT_MAX_REQUESTS: "100",
        QR_EXPIRY_HOURS: "72",
        LOG_LEVEL: "debug",
        LOG_FILE_PATH: "./logs/app.log",
        BACKUP_PATH: "./backups",
        BACKUP_RETENTION_DAYS: "30",
      },

      // Logging configuration
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_file: "./logs/pm2-combined.log",
      time: true, // Prefix logs with timestamps
      merge_logs: true,
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Restart behavior
      min_uptime: "10s",
      max_restarts: 10,
      restart_delay: 4000,

      // Load environment file (secrets like passwords, API keys)
      env_file: ".env",
    },
  ],
};
