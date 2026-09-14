const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID || '',
  pollIntervalSeconds: Math.max(10, parseInt(process.env.POLL_INTERVAL_SECONDS, 10) || 60),
  dataFilePath: process.env.DATA_FILE_PATH 
    ? path.resolve(__dirname, '../../', process.env.DATA_FILE_PATH)
    : path.resolve(__dirname, '../../data/stalker_data.json'),
  enableTelegramPolling: process.env.ENABLE_TELEGRAM_POLLING !== 'false',
  
  isTelegramConfigured() {
    return Boolean(
      this.telegramBotToken && 
      this.telegramBotToken !== 'your_telegram_bot_token_here' &&
      this.telegramBotToken.trim().length > 10
    );
  }
};

module.exports = config;
