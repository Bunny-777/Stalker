const storage = require('../services/storageService');
const leetcodeService = require('../services/leetcodeService');
const trackerService = require('../services/trackerService');

/**
 * Get all tracked targets
 */
async function getAllTargets(req, res) {
  try {
    const targets = storage.getTargets();
    return res.json({ success: true, count: targets.length, data: targets });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Preview LeetCode profile before tracking
 */
async function previewProfile(req, res) {
  try {
    const { query } = req.params;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query is required (username or URL).' });
    }

    const profile = await leetcodeService.getUserProfile(query);
    const enrichedRecent = await leetcodeService.enrichSubmissions(profile.recentSubmissions.slice(0, 5));

    return res.json({
      success: true,
      data: {
        ...profile,
        recentSubmissions: enrichedRecent
      }
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * Add a new target to track
 */
async function addTarget(req, res) {
  try {
    const { input, telegramChatId } = req.body;

    if (!input || typeof input !== 'string') {
      return res.status(400).json({ success: false, error: 'Please provide a LeetCode username or URL.' });
    }

    // 1. Fetch live profile to validate username
    const profile = await leetcodeService.getUserProfile(input);

    // 2. Add to persistent storage
    const target = storage.addTarget({
      ...profile,
      telegramChatId: telegramChatId ? String(telegramChatId).trim() : ''
    });

    return res.status(201).json({
      success: true,
      message: `Successfully tracking @${target.username}`,
      data: target
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * Remove a tracked target
 */
async function removeTarget(req, res) {
  try {
    const { id } = req.params;
    const removed = storage.removeTarget(id);

    if (!removed) {
      return res.status(404).json({ success: false, error: 'Target not found.' });
    }

    return res.json({ success: true, message: 'Target removed successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Toggle enable/pause for a target
 */
async function toggleTarget(req, res) {
  try {
    const { id } = req.params;
    const target = storage.getTargetById(id);

    if (!target) {
      return res.status(404).json({ success: false, error: 'Target not found.' });
    }

    const updated = storage.updateTarget(id, { enabled: !target.enabled });

    return res.json({
      success: true,
      message: `Target ${updated.enabled ? 'enabled' : 'paused'}`,
      data: updated
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Trigger manual check on a specific target
 */
async function checkSingleTarget(req, res) {
  try {
    const { id } = req.params;
    const result = await trackerService.checkSingleTarget(id);

    return res.json({
      success: true,
      message: `Checked @${result.target.username}. ${result.newSubmissionsCount} new submission(s) found.`,
      data: result
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
}

/**
 * Trigger manual check on all targets
 */
async function checkAllTargets(req, res) {
  try {
    trackerService.checkAllTargets(); // Run asynchronously or synchronously
    return res.json({
      success: true,
      message: 'Immediate check initiated for all active targets.'
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get recent submissions history
 */
async function getHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = storage.getHistory(limit);
    return res.json({ success: true, count: history.length, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

module.exports = {
  getAllTargets,
  previewProfile,
  addTarget,
  removeTarget,
  toggleTarget,
  checkSingleTarget,
  checkAllTargets,
  getHistory
};
