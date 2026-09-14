const fs = require('fs');
const path = require('path');
const config = require('../config/env');

class StorageService {
  constructor() {
    this.filePath = config.dataFilePath;
    this.data = {
      targets: [],
      history: [],
      settings: {
        defaultChatId: config.telegramDefaultChatId || '',
        pollIntervalSeconds: config.pollIntervalSeconds || 60
      }
    };
    this.init();
  }

  init() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = {
          targets: Array.isArray(parsed.targets) ? parsed.targets : [],
          history: Array.isArray(parsed.history) ? parsed.history : [],
          settings: {
            ...this.data.settings,
            ...(parsed.settings || {})
          }
        };
        console.log(`[Storage] Loaded ${this.data.targets.length} targets from ${this.filePath}`);
      } else {
        this.save();
        console.log(`[Storage] Created new database file at ${this.filePath}`);
      }
    } catch (err) {
      console.error('[Storage] Error initializing storage file, using in-memory state:', err.message);
    }
  }

  save() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('[Storage] Failed to persist data to disk:', err.message);
    }
  }

  // Targets operations
  getTargets() {
    return [...this.data.targets];
  }

  getTargetById(id) {
    return this.data.targets.find(t => t.id === id);
  }

  getTargetByUsername(username) {
    if (!username) return null;
    const lower = username.trim().toLowerCase();
    return this.data.targets.find(t => t.username.toLowerCase() === lower);
  }

  addTarget(target) {
    const existingIndex = this.data.targets.findIndex(
      t => t.username.toLowerCase() === target.username.toLowerCase()
    );

    const now = Date.now();
    let initialChatIds = [];
    if (target.telegramChatId) initialChatIds.push(String(target.telegramChatId).trim());
    if (Array.isArray(target.telegramChatIds)) initialChatIds.push(...target.telegramChatIds.map(id => String(id).trim()));
    initialChatIds = Array.from(new Set(initialChatIds.filter(Boolean)));

    const newTarget = {
      id: target.id || `target_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      username: target.username,
      realName: target.realName || target.username,
      avatar: target.avatar || 'https://assets.leetcode.com/users/default_avatar.jpg',
      ranking: target.ranking || null,
      stats: target.stats || { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 },
      telegramChatId: initialChatIds[0] || '',
      telegramChatIds: initialChatIds,
      enabled: target.enabled !== undefined ? target.enabled : true,
      lastCheckedAt: now,
      lastSolvedAt: target.lastSolvedAt || (target.recentSubmissions?.[0]?.timestamp ? target.recentSubmissions[0].timestamp * 1000 : now),
      knownSubmissionIds: target.recentSubmissions ? target.recentSubmissions.map(s => String(s.id)) : [],
      lastSubmission: target.recentSubmissions?.[0] || null,
      createdAt: now,
      updatedAt: now
    };

    if (existingIndex >= 0) {
      const existing = this.data.targets[existingIndex];
      const mergedChatIds = Array.from(new Set([
        ...(existing.telegramChatIds || (existing.telegramChatId ? [existing.telegramChatId] : [])),
        ...initialChatIds
      ])).filter(Boolean);

      this.data.targets[existingIndex] = {
        ...existing,
        ...newTarget,
        telegramChatId: mergedChatIds[0] || '',
        telegramChatIds: mergedChatIds,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: now
      };
      this.save();
      return this.data.targets[existingIndex];
    } else {
      this.data.targets.push(newTarget);
      this.save();
      return newTarget;
    }
  }

  updateTarget(id, updates) {
    const index = this.data.targets.findIndex(t => t.id === id);
    if (index === -1) return null;

    this.data.targets[index] = {
      ...this.data.targets[index],
      ...updates,
      updatedAt: Date.now()
    };
    this.save();
    return this.data.targets[index];
  }

  removeTarget(id) {
    const initialLen = this.data.targets.length;
    this.data.targets = this.data.targets.filter(t => t.id !== id);
    const removed = this.data.targets.length < initialLen;
    if (removed) {
      this.save();
    }
    return removed;
  }

  // History operations
  getHistory(limit = 50) {
    return this.data.history.slice(-limit).reverse();
  }

  addHistoryItem(item) {
    const historyItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      ...item
    };
    this.data.history.push(historyItem);
    
    // Keep max 200 items in history
    if (this.data.history.length > 200) {
      this.data.history = this.data.history.slice(-200);
    }
    this.save();
    return historyItem;
  }

  // Settings operations
  getSettings() {
    return { ...this.data.settings };
  }

  updateSettings(updates) {
    this.data.settings = {
      ...this.data.settings,
      ...updates
    };
    this.save();
    return this.data.settings;
  }
}

// Export singleton instance
module.exports = new StorageService();
