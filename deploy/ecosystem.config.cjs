module.exports = {
  apps: [
    {
      name: "nabd-watch",
      script: ".output/server/index.mjs",
      cwd: "/var/www/nabd",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
      },
    },
  ],
};
