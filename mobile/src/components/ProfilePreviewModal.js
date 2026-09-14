import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Image, TouchableOpacity, TextInput, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { colors } from '../theme/colors';
import { formatNumber, getDifficultyStyle, formatTimeAgo } from '../utils/helpers';
import StatPill from './StatPill';

export default function ProfilePreviewModal({
  visible,
  profile,
  onClose,
  onConfirm,
  isSaving
}) {
  const [customChatId, setCustomChatId] = useState('');

  if (!profile) return null;

  const stats = profile.stats || { totalSolved: 0, easySolved: 0, mediumSolved: 0, hardSolved: 0 };
  const recent = profile.recentSubmissions || [];

  const handleConfirm = () => {
    onConfirm(customChatId);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Verified Profile</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Profile Info */}
            <View style={styles.profileBox}>
              <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              <View style={styles.profileDetails}>
                <Text style={styles.realName}>{profile.realName}</Text>
                <Text style={styles.username}>@{profile.username}</Text>
                {profile.ranking && (
                  <View style={styles.rankPill}>
                    <Text style={styles.rankText}>🏆 Rank #{formatNumber(profile.ranking)}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Breakdown */}
            <Text style={styles.sectionLabel}>SOLVED STATISTICS</Text>
            <View style={styles.statsRow}>
              <StatPill type="total" count={stats.totalSolved} />
              <StatPill type="easy" count={stats.easySolved} />
              <StatPill type="medium" count={stats.mediumSolved} />
              <StatPill type="hard" count={stats.hardSolved} />
            </View>

            {/* Recent Solves Preview */}
            {recent.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>RECENT SOLVES</Text>
                <View style={styles.recentList}>
                  {recent.slice(0, 3).map((item, idx) => {
                    const diffStyle = getDifficultyStyle(item.difficulty);
                    return (
                      <View key={idx} style={styles.recentItem}>
                        <View style={styles.recentItemLeft}>
                          <Text style={styles.recentTitle} numberOfLines={1}>
                            {item.title}
                          </Text>
                          <Text style={styles.recentTime}>{formatTimeAgo(item.timestamp)}</Text>
                        </View>
                        <View style={[styles.diffBadge, { backgroundColor: diffStyle.bg, borderColor: diffStyle.borderColor }]}>
                          <Text style={[styles.diffText, { color: diffStyle.color }]}>{diffStyle.label}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            {/* Telegram Chat ID Override Input */}
            <Text style={styles.sectionLabel}>NOTIFICATION TARGET</Text>
            <View style={styles.chatIdBox}>
              <Text style={styles.chatIdLabel}>Custom Telegram Chat ID (Optional):</Text>
              <TextInput
                style={styles.chatIdInput}
                placeholder="Leave blank to use default Chat ID"
                placeholderTextColor={colors.textMuted}
                value={customChatId}
                onChangeText={setCustomChatId}
                keyboardType="numeric"
              />
              <Text style={styles.chatIdHint}>
                Alerts will be sent to your Telegram whenever this user solves a problem.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSaving}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.confirmBtn, isSaving && styles.confirmBtnDisabled]} 
              onPress={handleConfirm}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color={colors.bgDark} size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>Start Tracking 🎯</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
    ...(Platform.OS === 'web' ? {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    } : {})
  },
  container: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    maxHeight: '85%',
    ...(Platform.OS === 'web' ? {
      borderRadius: 24,
      width: '100%',
      maxWidth: 500,
      boxShadow: '0 10px 40px rgba(0,0,0,0.8)'
    } : {})
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.accent,
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  realName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  username: {
    fontSize: 13,
    color: colors.cyan,
    marginTop: 2,
    fontWeight: '600',
  },
  rankPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 161, 22, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  rankText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  recentList: {
    backgroundColor: colors.bgDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  recentItemLeft: {
    flex: 1,
    marginRight: 8,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  recentTime: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
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
  chatIdBox: {
    backgroundColor: colors.bgDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 16,
  },
  chatIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  chatIdInput: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: colors.textPrimary,
    fontSize: 14,
  },
  chatIdHint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 2,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.6,
  },
  confirmBtnText: {
    color: colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  }
});
