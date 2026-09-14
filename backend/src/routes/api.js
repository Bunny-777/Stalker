const express = require('express');
const router = express.Router();

const targetsController = require('../controllers/targetsController');
const telegramController = require('../controllers/telegramController');
const settingsController = require('../controllers/settingsController');
const trackerService = require('../services/trackerService');
const config = require('../config/env');

// Health Check
router.get('/health', (req, res) => {
  return res.json({
    status: 'online',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    tracker: trackerService.getStatus(),
    telegramReady: config.isTelegramConfigured()
  });
});

// Targets Endpoints
router.get('/targets', targetsController.getAllTargets);
router.get('/leetcode/preview/:query', targetsController.previewProfile);
router.post('/targets', targetsController.addTarget);
router.delete('/targets/:id', targetsController.removeTarget);
router.patch('/targets/:id/toggle', targetsController.toggleTarget);
router.post('/targets/:id/check', targetsController.checkSingleTarget);
router.post('/targets/check-all', targetsController.checkAllTargets);

// History / Activity Feed
router.get('/history', targetsController.getHistory);

// Telegram Test & Status
router.post('/telegram/test', telegramController.sendTestAlert);
router.get('/telegram/status', telegramController.getBotStatus);

// Settings
router.get('/settings', settingsController.getSettings);
router.post('/settings', settingsController.updateSettings);

module.exports = router;
