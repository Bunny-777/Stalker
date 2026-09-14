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
  Linking 
} from 'react-native';
import { colors } from '../theme/colors';
import api from '../api/client';

export default function SettingsScreen() {
  const [apiUrl, setApiUrl] = useState('');
  const [defaultChatId, setDefaultChatId] = useState('');
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
      setApiUrl(currentUrl);

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
            Enter your running backend host address. If using Android Emulator, use 10.0.2.2:5000.
          </Text>

          <TextInput
            style={styles.input}
            value={apiUrl}
            onChangeText={setApiUrl}
            placeholder="http://10.0.2.2:5000 or https://your-app.onrender.com"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Preset Buttons */}
          <View style={styles.presetRow}>
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
          <Text style={styles.cardTitle}>🤖 Telegram Bot Integration</Text>
          
          {botStatus && (
            <View style={styles.statusBox}>
              <Text style={styles.statusLabel}>Bot Status:</Text>
              <Text style={[styles.statusVal, { color: botStatus.isConfigured ? colors.easy : colors.warning }]}>
                {botStatus.isConfigured ? 'Token Configured ✅' : 'Token Missing in .env ⚠️'}
              </Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Default Telegram Chat ID</Text>
          <TextInput
            style={styles.input}
            value={defaultChatId}
            onChangeText={setDefaultChatId}
            placeholder="e.g. 6344734804"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
          />

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

        {/* 3. Step-by-Step Telegram Setup Guide */}
        <View style={styles.guideCard}>
          <Text style={styles.guideTitle}>📖 How to Setup Telegram Bot</Text>
          
          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>1</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeader}>Create Bot with @BotFather</Text>
              <Text style={styles.stepDesc}>
                Open Telegram, search for <Text style={styles.highlight}>@BotFather</Text>, send <Text style={styles.code}>/newbot</Text>, name your bot, and copy the API Token. Paste it into your backend <Text style={styles.code}>.env</Text> file.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>2</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeader}>Find Your Telegram Chat ID</Text>
              <Text style={styles.stepDesc}>
                Search for <Text style={styles.highlight}>@userinfobot</Text> in Telegram and message it, or open your newly created bot and press <Text style={styles.code}>/start</Text>. Enter that ID into the Chat ID box above.
              </Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <Text style={styles.stepNum}>3</Text>
            <View style={styles.stepContent}>
              <Text style={styles.stepHeader}>Test & Receive Alerts</Text>
              <Text style={styles.stepDesc}>
                Tap "Send Test Alert" above to verify the connection. Whenever any tracked user submits a problem, you will receive instant notifications!
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
  }
});
