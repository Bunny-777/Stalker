const config = require('../config/env');
const storage = require('./storageService');
const leetcodeService = require('./leetcodeService');
const telegramService = require('./telegramService');

class TrackerService {
  constructor() {
    this.intervalHandle = null;
    this.isChecking = false;
    this.lastCheckTimestamp = null;
  }

  start() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
    }

    const intervalMs = config.pollIntervalSeconds * 1000;
    console.log(`[Tracker] Background polling started. Checking every ${config.pollIntervalSeconds} seconds.`);

    // Run first check after a brief 5-second initial delay so the server finishes boot
    setTimeout(() => {
      this.checkAllTargets();
    }, 5000);

    this.intervalHandle = setInterval(() => {
      this.checkAllTargets();
    }, intervalMs);
  }

  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      console.log('[Tracker] Background polling stopped.');
    }
  }

  /**
   * Check all enabled targets sequentially or in batch
   */
  async checkAllTargets() {
    if (this.isChecking) {
      console.log('[Tracker] Previous check cycle still running, skipping this tick.');
      return;
    }

    this.isChecking = true;
    this.lastCheckTimestamp = Date.now();

    try {
      const targets = storage.getTargets().filter(t => t.enabled);
      if (targets.length === 0) {
        return;
      }

      console.log(`[Tracker] Checking ${targets.length} active target(s)...`);

      for (const target of targets) {
        try {
          await this.checkSingleTarget(target.id);
          // Add a small 500ms delay between targets to be gentle on LeetCode API
          await new Promise(r => setTimeout(r, 500));
        } catch (err) {
          console.error(`[Tracker] Error checking target ${target.username}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Tracker] Unexpected error during checkAllTargets:', err.message);
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Check a single target by ID
   */
  async checkSingleTarget(targetId) {
    const target = storage.getTargetById(targetId);
    if (!target) {
      throw new Error(`Target with ID ${targetId} not found.`);
    }

    console.log(`[Tracker] Polling stats for @${target.username}...`);

    // 1. Fetch latest profile from LeetCode GraphQL
    const profile = await leetcodeService.getUserProfile(target.username);
    const knownIds = new Set(target.knownSubmissionIds || []);
    const lastSolvedAtSec = target.lastSolvedAt ? Math.floor(target.lastSolvedAt / 1000) : 0;

    // 2. Identify new submissions
    const rawNewSubmissions = leetcodeService.findNewSubmissions(
      profile.recentSubmissions, 
      knownIds, 
      lastSolvedAtSec
    );

    let newSubmissionsCount = 0;

    if (rawNewSubmissions.length > 0) {
      console.log(`[Tracker] 🔥 Found ${rawNewSubmissions.length} new submission(s) for @${target.username}!`);
      
      // 3. Enrich submissions with difficulty & topic tags
      const enrichedSubmissions = await leetcodeService.enrichSubmissions(rawNewSubmissions);

      for (const sub of enrichedSubmissions) {
        // Send alert via Telegram
        await telegramService.sendSubmissionAlert(target, sub, profile.stats);

        // Record to persistent history
        storage.addHistoryItem({
          targetId: target.id,
          username: target.username,
          realName: target.realName,
          submission: sub,
          stats: profile.stats
        });

        newSubmissionsCount++;
      }
    }

    // 4. Update stored target state
    const allRecentIds = profile.recentSubmissions.map(s => String(s.id));
    const mergedKnownIds = Array.from(new Set([...(target.knownSubmissionIds || []), ...allRecentIds]));
    
    // Keep max 50 known IDs per target
    const trimmedKnownIds = mergedKnownIds.slice(-50);

    const latestSubmission = profile.recentSubmissions?.[0] || target.lastSubmission;
    const latestTimestamp = latestSubmission ? latestSubmission.timestamp * 1000 : target.lastSolvedAt;

    const updated = storage.updateTarget(target.id, {
      realName: profile.realName,
      avatar: profile.avatar,
      ranking: profile.ranking,
      stats: profile.stats,
      lastCheckedAt: Date.now(),
      lastSolvedAt: latestTimestamp,
      knownSubmissionIds: trimmedKnownIds,
      lastSubmission: latestSubmission
    });

    return {
      target: updated,
      newSubmissionsCount,
      detectedSubmissions: rawNewSubmissions
    };
  }

  getStatus() {
    const targets = storage.getTargets();
    return {
      isPollingActive: Boolean(this.intervalHandle),
      isCheckingNow: this.isChecking,
      lastCheckTimestamp: this.lastCheckTimestamp,
      totalTargets: targets.length,
      activeTargets: targets.filter(t => t.enabled).length,
      pollIntervalSeconds: config.pollIntervalSeconds
    };
  }
}

module.exports = new TrackerService();
