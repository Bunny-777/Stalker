import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { colors } from '../theme/colors';
import { formatTimeAgo, getDifficultyStyle } from '../utils/helpers';

export default function SubmissionCard({ item }) {
  const sub = item.submission || {};
  const diffStyle = getDifficultyStyle(sub.difficulty);
  const problemUrl = sub.problemUrl || `https://leetcode.com/problems/${sub.titleSlug}/`;

  const openProblem = () => {
    if (problemUrl) {
      Linking.openURL(problemUrl);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.userRow}>
          <Text style={styles.userEmoji}>🎯</Text>
          <Text style={styles.realName}>{item.realName || item.username}</Text>
          <Text style={styles.username}>@{item.username}</Text>
        </View>
        <Text style={styles.timeAgo}>{formatTimeAgo(sub.timestamp || item.timestamp)}</Text>
      </View>

      <TouchableOpacity onPress={openProblem} activeOpacity={0.8} style={styles.problemContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.problemTitle} numberOfLines={2}>
            {sub.title || 'Solved Problem'}
          </Text>
        </View>

        <View style={styles.badgeRow}>
          <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg, borderColor: diffStyle.borderColor }]}>
            <Text style={[styles.diffText, { color: diffStyle.color }]}>{diffStyle.label}</Text>
          </View>

          {Array.isArray(sub.tags) && sub.tags.slice(0, 2).map((tag, idx) => (
            <View key={idx} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Solve ↗</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  userEmoji: {
    fontSize: 13,
    marginRight: 6,
  },
  realName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
  },
  username: {
    fontSize: 12,
    color: colors.textMuted,
  },
  timeAgo: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  problemContainer: {
    backgroundColor: colors.bgDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
  },
  titleRow: {
    marginBottom: 8,
  },
  problemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 6,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagBadge: {
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  linkRow: {
    marginLeft: 'auto',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cyan,
  }
});
