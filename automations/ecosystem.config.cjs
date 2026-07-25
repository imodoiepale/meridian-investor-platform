module.exports = {
  apps: [{
    name: 'automation-agent',
    script: 'src/worker/index.mjs',
    node_args: '--experimental-modules',
    cwd: __dirname,
    env: {
      NODE_ENV: 'production',
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: 'logs/worker-error.log',
    out_file: 'logs/worker-out.log',
    merge_logs: true,
    max_restarts: 10,
    restart_delay: 5000,
    max_memory_restart: '500M',
    kill_timeout: 10000,
    wait_ready: false,
    autorestart: true,
    cron_restart: '0 4 * * *',
  }],
};
