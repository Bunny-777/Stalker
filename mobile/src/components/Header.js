import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';

export default function Header({ 
  isConnected = true, 
  activeCount = 0, 
  onCheckAll, 
  isChecking = false 
}) {
  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <View style={styles.logoRow}>
          <View style={styles.brandIcon}>
            <Text style={styles.brandIconText}>⚡</Text>
          </View>
          <View>
            <Text style={styles.title}>LeetCode Stalker</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: isConnected ? colors.easy : colors.danger }]} />
              <Text style={styles.statusText}>
                {isConnected ? `${activeCount} Active Target${activeCount === 1 ? '' : 's'}` : 'Backend Offline'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {onCheckAll && (
        <TouchableOpacity 
          style={[styles.checkAllBtn, isChecking && styles.checkAllBtnDisabled]} 
          onPress={onCheckAll}
          disabled={isChecking}
          activeOpacity={0.7}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Text style={styles.checkAllIcon}>🔄</Text>
              <Text style={styles.checkAllText}>Check All</Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    flex: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 161, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 22, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandIconText: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: 0.3,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  checkAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 161, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 22, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  checkAllBtnDisabled: {
    opacity: 0.6,
  },
  checkAllIcon: {
    fontSize: 13,
    marginRight: 5,
  },
  checkAllText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  }
});
