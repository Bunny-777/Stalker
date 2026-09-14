import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { colors } from '../theme/colors';
import api from '../api/client';
import Header from '../components/Header';
import TargetCard from '../components/TargetCard';

export default function HomeScreen({ onNavigateToAdd }) {
  const [targets, setTargets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadTargets = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    setErrorMessage(null);

    try {
      const resp = await api.getTargets();
      if (resp.success) {
        setTargets(resp.data || []);
        setIsConnected(true);
      }
    } catch (err) {
      setIsConnected(false);
      setErrorMessage(err.message);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTargets(true);
    const interval = setInterval(() => {
      loadTargets(false);
    }, 15000); // Poll local status every 15s
    return () => clearInterval(interval);
  }, [loadTargets]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadTargets(false);
  };

  const handleCheckAll = async () => {
    try {
      setIsCheckingAll(true);
      await api.checkAllTargets();
      Alert.alert('Check Initiated', 'Checking all active profiles for new submissions.');
      setTimeout(() => loadTargets(false), 2000);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsCheckingAll(false);
    }
  };

  const handleCheckSingle = async (targetId) => {
    try {
      const resp = await api.checkSingleTarget(targetId);
      if (resp.success) {
        const count = resp.data.newSubmissionsCount;
        if (count > 0) {
          Alert.alert('New Submissions Found! 🎉', `Found ${count} new solve(s)! Telegram notification sent.`);
        } else {
          Alert.alert('Checked', 'No new submissions since last check.');
        }
        loadTargets(false);
      }
    } catch (err) {
      Alert.alert('Check Failed', err.message);
    }
  };

  const handleToggle = async (targetId) => {
    try {
      await api.toggleTarget(targetId);
      loadTargets(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = async (targetId) => {
    try {
      await api.removeTarget(targetId);
      loadTargets(false);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const activeTargetsCount = targets.filter(t => t.enabled).length;

  return (
    <View style={styles.container}>
      <Header 
        isConnected={isConnected}
        activeCount={activeTargetsCount}
        onCheckAll={handleCheckAll}
        isChecking={isCheckingAll}
      />

      {/* Error / Offline Banner */}
      {!isConnected && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerIcon}>⚠️</Text>
          <View style={styles.errorBannerTextContainer}>
            <Text style={styles.errorBannerTitle}>Connection Issue</Text>
            <Text style={styles.errorBannerDesc}>
              {errorMessage || 'Unable to reach backend server. Check Settings tab to configure URL.'}
            </Text>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Connecting to LeetCode Stalker...</Text>
        </View>
      ) : (
        <FlatList
          data={targets}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TargetCard 
              target={item}
              onCheck={handleCheckSingle}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          ListHeaderComponent={
            targets.length > 0 ? (
              <View style={styles.summaryBar}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{targets.length}</Text>
                  <Text style={styles.summaryLabel}>Total Tracked</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.easy }]}>{activeTargetsCount}</Text>
                  <Text style={styles.summaryLabel}>Active Polling</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={[styles.summaryValue, { color: colors.cyan }]}>
                    {targets.reduce((acc, t) => acc + (t.stats?.totalSolved || 0), 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Combined Solved</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={styles.emptyTitle}>No Targets Tracked Yet</Text>
              <Text style={styles.emptySubtitle}>
                Add your friends, rivals, or favorite LeetCode users to get instant Telegram notifications when they solve questions!
              </Text>
              <TouchableOpacity style={styles.emptyAddBtn} onPress={onNavigateToAdd} activeOpacity={0.8}>
                <Text style={styles.emptyAddBtnText}>+ Track First LeetCoder</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(244, 63, 94, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorBannerIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  errorBannerTextContainer: {
    flex: 1,
  },
  errorBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger,
  },
  errorBannerDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  }
});
