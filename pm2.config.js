module.exports = {
  apps: [
    {
      name: 'dsr-analytics',
      script: './dist/server.js',
      exec_mode: 'cluster',
      instances: 'max',
    },
  ],
};
