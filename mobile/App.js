import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Platform 
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { registerRootComponent } from 'expo';
import { colors } from './src/theme/colors';

// Screens
import HomeScreen from './src/screens/HomeScreen';
import AddTargetScreen from './src/screens/AddTargetScreen';
import SubmissionsScreen from './src/screens/SubmissionsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const TABS = [
  { key: 'targets', label: 'Targets', icon: '🎯' },
  { key: 'add', label: 'Add Target', icon: '➕' },
  { key: 'activity', label: 'Activity', icon: '📊' },
  { key: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('targets');

  return (
    <View style={styles.webWrapper}>
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="light" backgroundColor={colors.bgDark} />
        
        {/* Screen Container */}
        <View style={styles.screenContainer}>
          {activeTab === 'targets' && (
            <HomeScreen onNavigateToAdd={() => setActiveTab('add')} />
          )}
          {activeTab === 'add' && (
            <AddTargetScreen onTargetAdded={() => setActiveTab('targets')} />
          )}
          {activeTab === 'activity' && (
            <SubmissionsScreen />
          )}
          {activeTab === 'settings' && (
            <SettingsScreen />
          )}
        </View>

        {/* Modern Cyberpunk Bottom Navigation Bar */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {isActive && <View style={styles.activeIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  webWrapper: {
    flex: 1,
    backgroundColor: '#05070B',
    ...(Platform.OS === 'web' ? {
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    } : {})
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgDark,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
    width: '100%',
    ...(Platform.OS === 'web' ? {
      maxWidth: 540,
      height: '100vh',
      maxHeight: '100vh',
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: colors.border,
      boxShadow: '0 0 50px rgba(0, 0, 0, 0.8)',
      overflow: 'hidden'
    } : {})
  },
  screenContainer: {
    flex: 1,
    backgroundColor: colors.bgDark,
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.tabBar,
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    paddingVertical: 10,
    paddingHorizontal: 8,
    ...(Platform.OS === 'web' ? {
      userSelect: 'none'
    } : {})
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    position: 'relative',
    cursor: 'pointer',
  },
  tabItemActive: {
    backgroundColor: 'rgba(255, 161, 22, 0.08)',
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 4,
    opacity: 0.6,
  },
  tabIconActive: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.tabInactive,
  },
  tabLabelActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
  }
});

registerRootComponent(App);

