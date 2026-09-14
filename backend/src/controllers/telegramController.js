const telegramService = require('../services/telegramService');
const config = require('../config/env');

/**
 * Send a test Telegram alert to verify bot token & chat ID
 */
async function sendTestAlert(req, res) {
  try {
    const { chatId } = req.body;
    const result = await telegramService.sendTestMessage(chatId);

    return res.json({
      success: true,
      message: `Test notification sent successfully to chat ID: ${result.chatId}`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({
      success: false,
      error: err.message
    });
  }
}

/**
 * Get current Telegram bot configuration status
 */
async function getBotStatus(req, res) {
  return res.json({
    success: true,
    data: {
      isConfigured: config.isTelegramConfigured(),
      isPolling: telegramService.isPolling,
      maskedToken: config.telegramBotToken 
        ? `${config.telegramBotToken.slice(0, 6)}...${config.telegramBotToken.slice(-4)}` 
        : 'Not Set',
      defaultChatId: config.telegramDefaultChatId || 'Not Set'
    }
  });
}

module.exports = {
  sendTestAlert,
  getBotStatus
};
