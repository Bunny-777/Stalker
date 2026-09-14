import { colors } from '../theme/colors';

/**
 * Format a timestamp into friendly relative time (e.g. "5m ago", "2h ago", "yesterday")
 */
export function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Never';
  
  // Normalize timestamp to ms
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
  const now = Date.now();
  const diffSec = Math.floor((now - ms) / 1000);

  if (diffSec < 0) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format numbers with commas (e.g. 105,065)
 */
export function formatNumber(num) {
  if (num === undefined || num === null) return '0';
  return Number(num).toLocaleString();
}

/**
 * Get color and background styling for difficulty tags
 */
export function getDifficultyStyle(difficulty) {
  const diff = String(difficulty || '').toLowerCase();
  
  switch (diff) {
    case 'easy':
      return {
        color: colors.easy,
        bg: colors.easyBg,
        borderColor: 'rgba(0, 184, 163, 0.4)',
        label: 'Easy'
      };
    case 'medium':
      return {
        color: colors.medium,
        bg: colors.mediumBg,
        borderColor: 'rgba(255, 192, 30, 0.4)',
        label: 'Medium'
      };
    case 'hard':
      return {
        color: colors.hard,
        bg: colors.hardBg,
        borderColor: 'rgba(239, 71, 67, 0.4)',
        label: 'Hard'
      };
    default:
      return {
        color: colors.textSecondary,
        bg: 'rgba(148, 163, 184, 0.12)',
        borderColor: colors.border,
        label: difficulty || 'Solved'
      };
  }
}

/**
 * Clean username from URL
 */
export function cleanUsernameInput(input) {
  if (!input) return '';
  let cleaned = input.trim();
  const urlMatch = cleaned.match(/(?:https?:\/\/)?(?:www\.)?leetcode\.(?:com|cn)\/(?:u\/)?([a-zA-Z0-9_\-]+)\/?/i);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return cleaned.replace(/^[@/]+/, '').replace(/\/+$/, '');
}
