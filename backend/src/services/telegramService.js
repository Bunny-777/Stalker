const TelegramBot = require('node-telegram-bot-api');
const config = require('../config/env');
const storage = require('./storageService');
const leetcodeService = require('./leetcodeService');

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

class TelegramService {
  constructor() {
    this.bot = null;
    this.isPolling = false;
    this.init();
  }

  init() {
    if (!config.isTelegramConfigured()) {
      console.warn('[Telegram] Warning: TELEGRAM_BOT_TOKEN is not set or using placeholder.');
      return;
    }

    try {
      if (config.enableTelegramPolling) {
        this.bot = new TelegramBot(config.telegramBotToken, {
          polling: true
        });
        this.isPolling = true;
        console.log('[Telegram] Telegram Bot initialized with polling.');
        this.registerBotCommands();
      } else {
        this.bot = new TelegramBot(config.telegramBotToken, { polling: false });
        console.log('[Telegram] Telegram Bot initialized in webhook/send-only mode.');
      }
    } catch (err) {
      console.error('[Telegram] Failed to initialize Telegram Bot:', err.message);
    }
  }

  registerBotCommands() {
    if (!this.bot) return;

    // Handle /start and /help
    this.bot.onText(/\/start|\/help/, (msg) => {
      const chatId = msg.chat.id;
      const welcomeMsg = `
👋 <b>Welcome to LeetCode Stalker Bot!</b>

Your Chat ID is: <code>${chatId}</code>

<b>Available Commands:</b>
• <code>/register &lt;username/url&gt;</code> - Start tracking a LeetCode user
• <code>/unregister &lt;username&gt;</code> - Stop tracking a user
• <code>/list</code> - View all tracked profiles
• <code>/stats &lt;username&gt;</code> - View current stats of a user
• <code>/checknow</code> - Manually trigger check for new solves
• <code>/myid</code> - Show your Chat ID

Whenever a tracked user solves a question, you'll get instant alerts here! 🚀
      `.trim();

      this.sendMessage(chatId, welcomeMsg, { parse_mode: 'HTML' });
    });

    // Handle /myid
    this.bot.onText(/\/myid/, (msg) => {
      this.sendMessage(
        msg.chat.id, 
        `🆔 Your Telegram Chat ID is: <code>${msg.chat.id}</code>`, 
        { parse_mode: 'HTML' }
      );
    });

    // Handle /register <username>
    this.bot.onText(/\/register(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const input = match[1]?.trim();

      if (!input) {
        return this.sendMessage(
          chatId, 
          '⚠️ Please provide a LeetCode username or URL.\nExample: <code>/register neal_wu</code>', 
          { parse_mode: 'HTML' }
        );
      }

      try {
        await this.sendMessage(chatId, `🔍 Searching LeetCode for <i>${escapeHtml(input)}</i>...`, { parse_mode: 'HTML' });
        const profile = await leetcodeService.getUserProfile(input);
        
        storage.addTarget({
          ...profile,
          telegramChatId: String(chatId)
        });

        const successMsg = `
✅ <b>Now Tracking ${escapeHtml(profile.realName)} (@${escapeHtml(profile.username)})!</b>

📊 <b>Current Solved Stats:</b>
• Total Solved: <b>${profile.stats.totalSolved}</b>
• 🟢 Easy: <b>${profile.stats.easySolved}</b>
• 🟡 Medium: <b>${profile.stats.mediumSolved}</b>
• 🔴 Hard: <b>${profile.stats.hardSolved}</b>
${profile.ranking ? `• 🏆 Global Ranking: #${profile.ranking.toLocaleString()}` : ''}

You will receive an alert whenever they solve a new question! 🎯
        `.trim();

        this.sendMessage(chatId, successMsg, { parse_mode: 'HTML' });
      } catch (err) {
        this.sendMessage(chatId, `❌ Error: ${escapeHtml(err.message)}`);
      }
    });

    // Handle /unregister <username>
    this.bot.onText(/\/unregister(?:\s+(.+))?/, (msg, match) => {
      const chatId = msg.chat.id;
      const input = match[1]?.trim();

      if (!input) {
        return this.sendMessage(
          chatId, 
          '⚠️ Please provide the username to unregister.\nExample: <code>/unregister neal_wu</code>', 
          { parse_mode: 'HTML' }
        );
      }

      const username = leetcodeService.extractUsername(input);
      const target = storage.getTargetByUsername(username);

      if (!target) {
        return this.sendMessage(chatId, `❌ User <b>${escapeHtml(username)}</b> is not in your tracking list.`, { parse_mode: 'HTML' });
      }

      storage.removeTarget(target.id);
      this.sendMessage(chatId, `🗑️ Stopped tracking <b>${escapeHtml(target.username)}</b>.`, { parse_mode: 'HTML' });
    });

    // Handle /list
    this.bot.onText(/\/list/, (msg) => {
      const chatId = msg.chat.id;
      const targets = storage.getTargets();

      if (targets.length === 0) {
        return this.sendMessage(
          chatId, 
          '📭 No users are currently tracked.\nUse <code>/register &lt;username&gt;</code> to add someone!', 
          { parse_mode: 'HTML' }
        );
      }

      let listMsg = `📋 <b>Tracked Profiles (${targets.length}):</b>\n\n`;
      targets.forEach((t, i) => {
        const status = t.enabled ? '🟢 Active' : '⏸️ Paused';
        listMsg += `${i + 1}. <b>${escapeHtml(t.realName)}</b> (@${escapeHtml(t.username)}) - ${status}\n`;
        listMsg += `   Solved: ${t.stats.totalSolved} (🟢${t.stats.easySolved} 🟡${t.stats.mediumSolved} 🔴${t.stats.hardSolved})\n\n`;
      });

      this.sendMessage(chatId, listMsg, { parse_mode: 'HTML' });
    });

    // Handle /stats <username>
    this.bot.onText(/\/stats(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const input = match[1]?.trim();

      if (!input) {
        return this.sendMessage(
          chatId, 
          '⚠️ Please specify a username.\nExample: <code>/stats neal_wu</code>', 
          { parse_mode: 'HTML' }
        );
      }

      try {
        const username = leetcodeService.extractUsername(input);
        const profile = await leetcodeService.getUserProfile(username);

        const statsMsg = `
📊 <b>Stats for ${escapeHtml(profile.realName)} (@${escapeHtml(profile.username)}):</b>

• Total Solved: <b>${profile.stats.totalSolved}</b>
• 🟢 Easy: <b>${profile.stats.easySolved}</b>
• 🟡 Medium: <b>${profile.stats.mediumSolved}</b>
• 🔴 Hard: <b>${profile.stats.hardSolved}</b>
${profile.ranking ? `• 🏆 Global Rank: #${profile.ranking.toLocaleString()}` : ''}
        `.trim();

        this.sendMessage(chatId, statsMsg, { parse_mode: 'HTML' });
      } catch (err) {
        this.sendMessage(chatId, `❌ Error: ${escapeHtml(err.message)}`);
      }
    });

    // Suppress polling conflict noise if another instance briefly polls
    this.bot.on('polling_error', (error) => {
      if (error.code === 'ETELEGRAM' && error.message?.includes('409 Conflict')) {
        console.warn('[Telegram Polling] 409 Conflict: Another instance is polling. (Alerts will still send normally via direct HTTP dispatch).');
      } else {
        console.warn('[Telegram Polling Warning]:', error.message || error);
      }
    });
  }

  /**
   * Send a formatted submission alert to a target's configured chat ID or default chat ID
   */
  async sendSubmissionAlert(target, submission, newStats) {
    const settings = storage.getSettings();
    
    // Collect all recipient Chat IDs (target-specific IDs + fallback default ID)
    let chatIds = [];
    if (Array.isArray(target.telegramChatIds) && target.telegramChatIds.length > 0) {
      chatIds = target.telegramChatIds;
    } else if (target.telegramChatId) {
      chatIds = [target.telegramChatId];
    } else if (settings.defaultChatId) {
      chatIds = [settings.defaultChatId];
    } else if (config.telegramDefaultChatId) {
      chatIds = [config.telegramDefaultChatId];
    }

    // Filter and deduplicate valid chat IDs
    chatIds = Array.from(new Set(chatIds.filter(Boolean).map(id => String(id).trim())));

    if (chatIds.length === 0) {
      console.warn(`[Telegram] No chat ID configured for target @${target.username}. Alert skipped.`);
      return false;
    }

    const diffIcon = submission.difficulty === 'Hard' ? '🔴' : (submission.difficulty === 'Medium' ? '🟡' : '🟢');
    const problemUrl = submission.problemUrl || `https://leetcode.com/problems/${submission.titleSlug}/`;
    const formattedDate = new Date(submission.timestamp * 1000).toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const safeRealName = escapeHtml(target.realName || target.username);
    const safeUsername = escapeHtml(target.username);
    const safeTitle = escapeHtml(submission.title);
    const safeDiff = escapeHtml(submission.difficulty || 'Solved');

    const message = `
🔥 <b>NEW LEETCODE SUBMISSION DETECTED!</b>

👤 <b>User:</b> ${safeRealName} (@${safeUsername})
📝 <b>Problem:</b> <a href="${problemUrl}">${safeTitle}</a>
🏷️ <b>Difficulty:</b> ${diffIcon} <b>${safeDiff}</b>
⏱️ <b>Solved At:</b> ${formattedDate}

📊 <b>Updated Stats:</b>
• Total: <b>${newStats?.totalSolved || target.stats.totalSolved}</b>
• 🟢 Easy: ${newStats?.easySolved || target.stats.easySolved} | 🟡 Medium: ${newStats?.mediumSolved || target.stats.mediumSolved} | 🔴 Hard: ${newStats?.hardSolved || target.stats.hardSolved}

🔗 <a href="${problemUrl}">Open Question on LeetCode</a>
<i>Keep the grind going! 🚀</i>
    `.trim();

    // Deliver notification to every subscriber of this target
    let sentCount = 0;
    for (const chatId of chatIds) {
      try {
        await this.sendMessage(chatId, message, { parse_mode: 'HTML', disable_web_page_preview: false });
        sentCount++;
      } catch (err) {
        console.error(`[Telegram] Failed to deliver alert to Chat ID ${chatId}:`, err.message);
      }
    }

    return sentCount > 0;
  }

  /**
   * Direct, robust Telegram message sender with instant HTTPS fetch
   */
  async sendMessage(chatId, text, options = {}) {
    if (!chatId || !text) {
      console.warn('[Telegram] Missing chatId or text in sendMessage.');
      return false;
    }

    const token = config.telegramBotToken;
    if (!token || token === 'your_telegram_bot_token_here') {
      console.warn('[Telegram] Cannot send message: TELEGRAM_BOT_TOKEN is not set.');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: String(chatId).trim(),
          text: text,
          parse_mode: options.parse_mode || 'HTML',
          disable_web_page_preview: options.disable_web_page_preview || false
        })
      });

      const data = await response.json();
      if (!data.ok) {
        console.error(`[Telegram API Error for ${chatId}]:`, data.description);
        throw new Error(data.description || 'Telegram API rejected message');
      }

      console.log(`[Telegram] Alert successfully delivered to Chat ID: ${chatId} (Msg ID: ${data.result?.message_id})`);
      return true;
    } catch (err) {
      console.error(`[Telegram Dispatch Failed for ${chatId}]:`, err.message);
      throw err;
    }
  }

  /**
   * Send a test notification
   */
  async sendTestMessage(targetChatId) {
    const settings = storage.getSettings();
    const chatId = targetChatId || settings.defaultChatId || config.telegramDefaultChatId;

    if (!chatId) {
      throw new Error('Telegram Chat ID is missing. Please provide a Chat ID.');
    }

    const testMsg = `
🤖 <b>LeetCode Stalker Bot Test Alert</b>

✅ <b>Status:</b> Telegram bot is connected and operational!
⏰ <b>Timestamp:</b> ${new Date().toLocaleString()}
🎯 <b>Ready:</b> You will receive instant notifications whenever tracked users solve LeetCode problems.
    `.trim();

    const sent = await this.sendMessage(chatId, testMsg, { parse_mode: 'HTML' });
    if (!sent) {
      throw new Error('Failed to send Telegram message.');
    }
    return { success: true, chatId };
  }
}

module.exports = new TelegramService();
