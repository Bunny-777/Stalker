import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { formatNumber } from '../utils/helpers';

export default function StatPill({ type, count, label }) {
  let color = colors.textSecondary;
  let bg = 'rgba(148, 163, 184, 0.1)';
  let dotColor = colors.textMuted;
  let title = label || type;

  if (type === 'easy') {
    color = colors.easy;
    bg = colors.easyBg;
    dotColor = colors.easy;
    title = label || 'Easy';
  } else if (type === 'medium') {
    color = colors.medium;
    bg = colors.mediumBg;
    dotColor = colors.medium;
    title = label || 'Medium';
  } else if (type === 'hard') {
    color = colors.hard;
    bg = colors.hardBg;
    dotColor = colors.hard;
    title = label || 'Hard';
  } else if (type === 'total') {
    color = colors.accent;
    bg = colors.accentGlow;
    dotColor = colors.accent;
    title = label || 'Total';
  }

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[styles.label, { color }]}>{title}:</Text>
      <Text style={[styles.count, { color }]}>{formatNumber(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
  }
});
