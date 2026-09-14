const storage = require('../services/storageService');
const config = require('../config/env');
const trackerService = require('../services/trackerService');

/**
 * Get current application settings & system stats
 */
async function getSettings(req, res) {
  try {
    const settings = storage.getSettings();
    const trackerStatus = trackerService.getStatus();

    return res.json({
      success: true,
      data: {
        settings,
        trackerStatus,
        server: {
          port: config.port,
          isTelegramConfigured: config.isTelegramConfigured(),
          uptime: process.uptime()
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Update application settings (e.g. defaultChatId, pollIntervalSeconds)
 */
async function updateSettings(req, res) {
  try {
    const { defaultChatId, pollIntervalSeconds } = req.body;
    const updates = {};

    if (defaultChatId !== undefined) {
      updates.defaultChatId = String(defaultChatId).trim();
    }

    if (pollIntervalSeconds !== undefined) {
      const parsed = parseInt(pollIntervalSeconds, 10);
      if (!isNaN(parsed) && parsed >= 10) {
        updates.pollIntervalSeconds = parsed;
        config.pollIntervalSeconds = parsed;
        // Restart tracker interval with new frequency
        trackerService.start();
      }
    }

    const updated = storage.updateSettings(updates);

    return res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updated
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  getSettings,
  updateSettings
};
