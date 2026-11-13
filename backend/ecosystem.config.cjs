// PM2: pm2 start ecosystem.config.cjs && pm2 save
module.exports = {
  apps: [
    {
      name: 'cinema-api',
      script: 'dist/server.js',
      instances: 1,
      env: { NODE_ENV: 'production' },
      max_memory_restart: '350M',
      time: true,
    },
  ],
};
