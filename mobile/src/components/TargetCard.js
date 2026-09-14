import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { colors } from '../theme/colors';
import { formatTimeAgo, formatNumber, getDifficultyStyle } from '../utils/helpers';
import StatPill from './StatPill';

export default function TargetCard({ 
  target, 
  onCheck, 
  onToggle, 
  onDelete 
}) {
  const [isChecking, setIsChecking] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const stats = target.stats || { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
  const lastSub = target.lastSubmission;
  const diffStyle = lastSub ? getDifficultyStyle(lastSub.difficulty) : null;

  const handleCheck = async () => {
    try {
      setIsChecking(true);
      await onCheck(target.id);
    } finally {
      setIsChecking(false);
    }
  };

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await onToggle(target.id);
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Remove Target',
      `Are you sure you want to stop tracking @${target.username}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onDelete(target.id) }
      ]
    );
  };

  const openLeetCodeProfile = () => {
    Linking.openURL(`https://leetcode.com/u/${target.username}/`);
  };

  return (
    <View style={[styles.card, !target.enabled && styles.cardDisabled]}>
      {/* Top Row: User Avatar & Names */}
      <View style={styles.topRow}>
        <TouchableOpacity onPress={openLeetCodeProfile} style={styles.avatarWrapper} activeOpacity={0.8}>
          {target.avatar ? (
            <Image source={{ uri: target.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {target.username.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.nameSection}>
          <View style={styles.nameRow}>
            <Text style={styles.realName} numberOfLines={1}>
              {target.realName || target.username}
            </Text>
            {target.ranking && (
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>#{formatNumber(target.ranking)}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={openLeetCodeProfile}>
            <Text style={styles.username}>@{target.username} ↗</Text>
          </TouchableOpacity>
        </View>

        {/* Enabled Status Badge */}
        <TouchableOpacity 
          style={[styles.statusBadge, target.enabled ? styles.statusActive : styles.statusPaused]}
          onPress={handleToggle}
          disabled={isToggling}
        >
          {isToggling ? (
            <ActivityIndicator size="small" color={target.enabled ? colors.easy : colors.textMuted} />
          ) : (
            <>
              <View style={[styles.statusDot, { backgroundColor: target.enabled ? colors.easy : colors.textMuted }]} />
              <Text style={[styles.statusText, { color: target.enabled ? colors.easy : colors.textMuted }]}>
                {target.enabled ? 'Live' : 'Paused'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Breakdown */}
      <View style={styles.statsRow}>
        <StatPill type="total" count={stats.totalSolved} />
        <StatPill type="easy" count={stats.easySolved} />
        <StatPill type="medium" count={stats.mediumSolved} />
        <StatPill type="hard" count={stats.hardSolved} />
      </View>

      {/* Last Solved Question Box */}
      {lastSub ? (
        <TouchableOpacity 
          style={styles.lastSubBox}
          activeOpacity={0.8}
          onPress={() => Linking.openURL(lastSub.problemUrl || `https://leetcode.com/problems/${lastSub.titleSlug}/`)}
        >
          <View style={styles.lastSubHeader}>
            <Text style={styles.lastSubLabel}>LATEST SOLVE</Text>
            <Text style={styles.lastSubTime}>{formatTimeAgo(lastSub.timestamp)}</Text>
          </View>
          <View style={styles.problemRow}>
            <Text style={styles.problemTitle} numberOfLines={1}>
              {lastSub.title}
            </Text>
            {diffStyle && (
              <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg, borderColor: diffStyle.borderColor }]}>
                <Text style={[styles.diffText, { color: diffStyle.color }]}>{diffStyle.label}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.noSubBox}>
          <Text style={styles.noSubText}>No recent submissions recorded yet</Text>
        </View>
      )}

      {/* Footer Actions */}
      <View style={styles.footerRow}>
        <View style={styles.lastCheckedInfo}>
          <Text style={styles.lastCheckedText}>
            Checked: {formatTimeAgo(target.lastCheckedAt)}
          </Text>
          {target.telegramChatId ? (
            <Text style={styles.chatIdText}>• TG: {target.telegramChatId}</Text>
          ) : null}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionBtnCheck} 
            onPress={handleCheck}
            disabled={isChecking}
            activeOpacity={0.7}
          >
            {isChecking ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <>
                <Text style={styles.actionBtnIcon}>⚡</Text>
                <Text style={styles.actionBtnText}>Check</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionBtnDelete} 
            onPress={handleDelete}
            activeOpacity={0.7}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardDisabled: {
    opacity: 0.75,
    borderColor: 'rgba(30, 41, 59, 0.5)',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.bgCardLight,
    borderWidth: 1.5,
    borderColor: colors.borderAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.accent,
  },
  nameSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  realName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 6,
    maxWidth: '65%',
  },
  rankBadge: {
    backgroundColor: 'rgba(255, 161, 22, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  username: {
    fontSize: 13,
    color: colors.cyan,
    marginTop: 2,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: colors.easyBg,
    borderColor: 'rgba(0, 184, 163, 0.3)',
  },
  statusPaused: {
    backgroundColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  lastSubBox: {
    backgroundColor: colors.bgDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 12,
  },
  lastSubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  lastSubTime: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  problemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  problemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  diffBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  noSubBox: {
    backgroundColor: colors.bgDark,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  noSubText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.5)',
    paddingTop: 10,
  },
  lastCheckedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastCheckedText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chatIdText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtnCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 161, 22, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 22, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
  },
  actionBtnIcon: {
    fontSize: 11,
    marginRight: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  actionBtnDelete: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  deleteIcon: {
    fontSize: 12,
  }
});
