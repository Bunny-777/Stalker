const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const config = require('./config/env');
const apiRoutes = require('./routes/api');
const trackerService = require('./services/trackerService');

const app = express();

// Middleware
app.use(cors()); // Allow cross-origin requests from React Native mobile apps & web
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Mount API routes
app.use('/api', apiRoutes);

// Root Status & Information Endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'LeetCode Stalker API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /api/health',
      targets: 'GET /api/targets',
      preview: 'GET /api/leetcode/preview/:usernameOrUrl',
      addTarget: 'POST /api/targets',
      history: 'GET /api/history',
      telegramTest: 'POST /api/telegram/test',
      settings: 'GET /api/settings'
    },
    telegramConfigured: config.isTelegramConfigured(),
    pollIntervalSeconds: config.pollIntervalSeconds
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.method} ${req.url}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Start Server
const server = app.listen(config.port, () => {
  console.log('====================================================');
  console.log(`🚀 LeetCode Stalker Backend running on http://localhost:${config.port}`);
  console.log(`📡 API Healthcheck: http://localhost:${config.port}/api/health`);
  console.log(`🤖 Telegram Bot Status: ${config.isTelegramConfigured() ? 'CONFIGURED ✅' : 'TOKEN MISSING (Set in .env or Settings) ⚠️'}`);
  console.log(`⏱️  Polling Interval: Every ${config.pollIntervalSeconds} seconds`);
  console.log('====================================================');

  // Start background tracker engine
  trackerService.start();
});

// Graceful Shutdown
const shutdown = () => {
  console.log('\n[Server] Shutting down gracefully...');
  trackerService.stop();
  server.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = app;
