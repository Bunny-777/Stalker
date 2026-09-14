import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  ActivityIndicator, 
  Linking,
  Platform
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';
import api from '../api/client';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('https://backend-stalker.onrender.com');
  const [defaultChatId, setDefaultChatId] = useState('8920447223');
  const [pollInterval, setPollInterval] = useState('60');
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isTestingTelegram, setIsTestingTelegram] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [botStatus, setBotStatus] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const currentUrl = await api.getBaseUrl();
      if (currentUrl) setApiUrl(currentUrl);

      const statusResp = await api.getTelegramStatus().catch(() => null);
      if (statusResp && statusResp.success) {
        setBotStatus(statusResp.data);
      }

      const settingsResp = await api.getSettings().catch(() => null);
      if (settingsResp && settingsResp.success) {
        const s = settingsResp.data.settings || {};
        if (s.defaultChatId) setDefaultChatId(String(s.defaultChatId));
        if (s.pollIntervalSeconds) setPollInterval(String(s.pollIntervalSeconds));
      }
    } catch (err) {
      console.warn('Error loading settings:', err);
    }
  };

  const handleSaveApiUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert('Error', 'Please enter a valid API URL.');
      return;
    }

    try {
      await api.setBaseUrl(apiUrl.trim());
      Alert.alert('Saved', `Backend API URL updated to:\n${apiUrl.trim()}`);
      loadSettings();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    try {
      await api.setBaseUrl(apiUrl.trim());
      const health = await api.getHealth();
      Alert.alert(
        'Connection Successful! ✅',
        `Connected to LeetCode Stalker Backend (v${health.version}).\nUptime: ${health.uptimeSeconds}s\nTelegram Bot: ${health.telegramReady ? 'Ready' : 'Token Not Configured'}`
      );
    } catch (err) {
      Alert.alert('Connection Failed ❌', err.message);
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const resp = await api.updateSettings({
        defaultChatId: defaultChatId.trim(),
        pollIntervalSeconds: parseInt(pollInterval, 10) || 60
      });
      if (resp.success) {
        Alert.alert('Success ✅', 'Server settings saved successfully.');
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasteChatId = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) setDefaultChatId(text.trim());
      } else if (Clipboard && typeof Clipboard.getStringAsync === 'function') {
        const text = await Clipboard.getStringAsync();
        if (text) setDefaultChatId(text.trim());
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
  };

  const handleTestTelegram = async () => {
    setIsTestingTelegram(true);
    try {
      const resp = await api.sendTestTelegram(defaultChatId.trim() || undefined);
      if (resp.success) {
        Alert.alert('Telegram Alert Sent! 🚀', `Check your Telegram app for the test notification.`);
      }
    } catch (err) {
      Alert.alert('Telegram Test Failed ❌', err.message);
    } finally {
      setIsTestingTelegram(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>App Settings & Setup</Text>
          <Text style={styles.headerSubtitle}>Configure your backend host & Telegram bot credentials</Text>
        </View>

        {/* 1. Backend Server Host Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🌐 Backend Server URL</Text>
          <Text style={styles.cardDesc}>
            Connected 24/7 cloud backend hosted on Render.
          </Text>

          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="https://backend-stalker.onrender.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Preset Buttons */}
          <View style={styles.presetRow}>
            <TouchableOpacity 
              style={styles.presetBtn} 
              onPress={() => setApiUrl('https://backend-stalker.onrender.com')}
            >
              <Text style={styles.presetText}>☁️ Cloud (Render)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetBtn} 
              onPress={() => setApiUrl('http://10.0.2.2:5000')}
            >
              <Text style={styles.presetText}>Emulator (10.0.2.2:5000)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.presetBtn} 
              onPress={() => setApiUrl('http://localhost:5000')}
            >
              <Text style={styles.presetText}>Localhost:5000</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.testBtn} 
              onPress={handleTestApi}
              disabled={isTestingApi}
            >
              {isTestingApi ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.testBtnText}>⚡ Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveApiUrl}>
              <Text style={styles.saveBtnText}>Save URL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Telegram Bot Configuration */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🤖 Telegram Notification Target</Text>
          
          {botStatus && (
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Bot Status:</Text>
              <Text style={[styles.statusVal, { color: botStatus.isConfigured ? colors.easy : colors.warning }]}>
                {botStatus.isConfigured ? 'Bot Online & Ready ✅' : 'Token Missing ⚠️'}
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Your Telegram Chat ID</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInputWithBtn}
              value={defaultChatId}
              onChangeText={setDefaultChatId}
              placeholder="e.g. 8920447223"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePasteChatId} activeOpacity={0.7}>
              <Text style={styles.pasteBtnText}>📋 Paste</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Background Polling Interval (Seconds)</Text>
          <TextInput
            style={styles.input}
            value={pollInterval}
            onChangeText={setPollInterval}
            placeholder="60"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.testBtn} 
              onPress={handleTestTelegram}
              disabled={isTestingTelegram}
            >
              {isTestingTelegram ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={styles.testBtnText}>📩 Send Test Alert</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.saveBtn} 
              onPress={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.bgDark} />
              ) : (
                <Text style={styles.saveBtnText}>Save Settings</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Step-by-Step Telegram Setup Guide with 1-Click Redirects */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>📖 2-Step Telegram Setup</Text>
          
          {/* Step 1 */}
          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeader}>Start the Stalker Bot</Text>
              <Text style={styles.stepDesc}>
                Open our Telegram bot and press <Text style={styles.code}>/start</Text> so it has permission to send you alerts.
              </Text>
              <TouchableOpacity 
                style={styles.redirectBtn}
                onPress={() => Linking.openURL('https://t.me/Telestalker_leetcode_bot')}
                activeOpacity={0.8}
              >
                <Text style={styles.redirectBtnText}>🚀 Open @Telestalker_leetcode_bot ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeader}>Get Your Chat ID</Text>
              <Text style={styles.stepDesc}>
                Open <Text style={styles.highlight}>@userinfobot</Text> in Telegram (or send <Text style={styles.code}>/myid</Text> to our bot). Copy your numeric ID, then tap <Text style={styles.code}>📋 Paste</Text> above!
              </Text>
              <TouchableOpacity 
                style={styles.redirectBtnSecondary}
                onPress={() => Linking.openURL('https://t.me/userinfobot')}
                activeOpacity={0.8}
              >
                <Text style={styles.redirectBtnTextSecondary}>🆔 Open @userinfobot to Get ID ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeader}>Test Notification</Text>
              <Text style={styles.stepDesc}>
                Tap <Text style={styles.highlight}>"Send Test Alert"</Text> above to verify. You are all set to receive live LeetCode notifications!
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.bgDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  presetBtn: {
    backgroundColor: 'rgba(255, 161, 22, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 22, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 6,
  },
  presetText: {
    fontSize: 11,
    color: colors.accent,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  testBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 22, 0.4)',
    backgroundColor: 'rgba(255, 161, 22, 0.1)',
    alignItems: 'center',
    marginRight: 10,
  },
  testBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  saveBtnText: {
    color: colors.bgDark,
    fontSize: 13,
    fontWeight: '800',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginRight: 6,
  },
  statusVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    color: colors.bgDark,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 22,
    marginRight: 10,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  highlight: {
    color: colors.cyan,
    fontWeight: '700',
  },
  code: {
    color: colors.accent,
    fontFamily: 'monospace',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  textInputWithBtn: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 13,
  },
  pasteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 161, 22, 0.12)',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  pasteBtnText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  redirectBtn: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 161, 22, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 161, 22, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  redirectBtnText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  redirectBtnSecondary: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  redirectBtnTextSecondary: {
    color: colors.cyan,
    fontSize: 12,
    fontWeight: '700',
  }
});
