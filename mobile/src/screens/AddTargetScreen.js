import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  ScrollView, 
  Keyboard,
  Platform 
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';
import api from '../api/client';
import { cleanUsernameInput } from '../utils/helpers';
import ProfilePreviewModal from '../components/ProfilePreviewModal';

const SUGGESTIONS = ['neal_wu', 'lee215', 'tourist', 'kushal'];

export default function AddTargetScreen({ onTargetAdded }) {
  const [input, setInput] = useState('');
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewProfile, setPreviewProfile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handlePaste = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) setInput(text.trim());
      } else if (Clipboard && typeof Clipboard.getStringAsync === 'function') {
        const text = await Clipboard.getStringAsync();
        if (text) setInput(text.trim());
      }
    } catch (err) {
      console.warn('Clipboard notice:', err);
    }
  };

  const handlePreview = async (overrideInput) => {
    const raw = overrideInput || input;
    const username = cleanUsernameInput(raw);

    if (!username) {
      Alert.alert('Missing Input', 'Please enter a LeetCode username or profile URL.');
      return;
    }

    if (Platform.OS !== 'web') {
      Keyboard.dismiss();
    }
    setIsPreviewing(true);

    try {
      const resp = await api.previewProfile(username);
      if (resp.success && resp.data) {
        setPreviewProfile(resp.data);
        setModalVisible(true);
      } else {
        throw new Error(resp.error || 'User not found on LeetCode.');
      }
    } catch (err) {
      Alert.alert('LeetCode Search Failed', err.message);
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmAdd = async (customChatId) => {
    if (!previewProfile) return;

    setIsSaving(true);
    try {
      const resp = await api.addTarget(previewProfile.username, customChatId);
      if (resp.success) {
        setModalVisible(false);
        setInput('');
        setPreviewProfile(null);
        Alert.alert(
          'Target Added! 🎯',
          `Now tracking @${resp.data.username}. You will be notified on Telegram whenever they solve a problem.`
        );
        if (onTargetAdded) {
          onTargetAdded();
        }
      }
    } catch (err) {
      Alert.alert('Failed to Add Target', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>
        {/* Title & Banner */}
        <View style={styles.headerBox}>
          <Text style={styles.headerIcon}>🕵️‍♂️</Text>
          <Text style={styles.title}>Track New LeetCoder</Text>
          <Text style={styles.subtitle}>
            Enter any LeetCode username or paste their profile URL to start real-time monitoring.
          </Text>
        </View>

        {/* Input Card */}
        <View style={styles.card}>
          <Text style={styles.inputLabel}>LeetCode Username or Profile URL</Text>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. https://leetcode.com/u/neal_wu/ or neal_wu"
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={() => handlePreview()}
            />
            
            <TouchableOpacity style={styles.pasteBtn} onPress={handlePaste} activeOpacity={0.7}>
              <Text style={styles.pasteBtnText}>📋 Paste</Text>
            </TouchableOpacity>
          </View>

          {/* Preview Button */}
          <TouchableOpacity 
            style={[styles.previewBtn, isPreviewing && styles.previewBtnDisabled]} 
            onPress={() => handlePreview()}
            disabled={isPreviewing}
            activeOpacity={0.8}
          >
            {isPreviewing ? (
              <ActivityIndicator color={colors.bgDark} size="small" />
            ) : (
              <Text style={styles.previewBtnText}>🔍 Verify & Preview Profile</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Suggestion Chips */}
        <View style={styles.suggestionsBox}>
          <Text style={styles.suggestionsTitle}>Quick Suggestions:</Text>
          <View style={styles.chipRow}>
            {SUGGESTIONS.map((sug) => (
              <TouchableOpacity
                key={sug}
                style={styles.chip}
                onPress={() => {
                  setInput(sug);
                  handlePreview(sug);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>@{sug}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* How It Works Explainer */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>💡 How Notification Works</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>1.</Text>
            <Text style={styles.infoText}>Backend polls LeetCode GraphQL API automatically in the background.</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>2.</Text>
            <Text style={styles.infoText}>When your target submits a new accepted solution, the bot triggers instantly.</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>3.</Text>
            <Text style={styles.infoText}>You receive a Telegram notification with the problem name, difficulty rating, and link.</Text>
          </View>
        </View>
      </View>

      {/* Profile Verification Modal */}
      <ProfilePreviewModal
        visible={modalVisible}
        profile={previewProfile}
        onClose={() => setModalVisible(false)}
        onConfirm={handleConfirmAdd}
        isSaving={isSaving}
      />
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
    paddingBottom: 40,
  },
  headerBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  headerIcon: {
    fontSize: 42,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginTop: 10,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    fontSize: 14,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {})
  },
  pasteBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 161, 22, 0.1)',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    cursor: 'pointer',
  },
  pasteBtnText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  previewBtn: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    cursor: 'pointer',
  },
  previewBtnDisabled: {
    opacity: 0.6,
  },
  previewBtnText: {
    color: colors.bgDark,
    fontSize: 15,
    fontWeight: '800',
  },
  suggestionsBox: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    cursor: 'pointer',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.cyan,
  },
  infoCard: {
    backgroundColor: 'rgba(21, 28, 44, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accent,
    marginRight: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  }
});
