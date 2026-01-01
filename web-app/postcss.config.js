module.exports = {
  apps: [{
    name: 'invoice-backend',
    script: './server/index.js',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
