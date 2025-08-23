import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft,
  Globe,
  Shield,
  Database,
  HelpCircle,
  FileText,
  Star,
  Share2,
  Trash2,
  Download,
  Moon,
  Sun,
  Smartphone,
  Lock
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { ListItem } from '../components/ui/ListItem';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface AppSettings {
  darkMode: boolean;
  biometricLogin: boolean;
  autoBackup: boolean;
  analyticsOptOut: boolean;
  crashReporting: boolean;
  language: string;
}

export default function AppSettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    biometricLogin: true,
    autoBackup: true,
    analyticsOptOut: false,
    crashReporting: true,
    language: 'English',
  });

  const updateSetting = (key: keyof AppSettings, value: boolean | string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // TODO: Save settings to local storage or backend
    console.log('App setting updated:', key, value);
    
    if (key === 'darkMode') {
      Alert.alert(
        'Theme Changed',
        'Dark mode will be applied after restarting the app.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLanguageSelect = () => {
    Alert.alert(
      'Select Language',
      'Choose your preferred language',
      [
        { text: 'English', onPress: () => updateSetting('language', 'English') },
        { text: 'French', onPress: () => updateSetting('language', 'French') },
        { text: 'Spanish', onPress: () => updateSetting('language', 'Spanish') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Download a copy of your personal data',
      [
        {
          text: 'JSON Format',
          onPress: () => Alert.alert('Coming Soon', 'Data export will be available soon.'),
        },
        {
          text: 'PDF Report',
          onPress: () => Alert.alert('Coming Soon', 'PDF export will be available soon.'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'I understand, delete my account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This will delete your account, points, and all data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Account',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      // TODO: Implement account deletion API
                      await signOut();
                      Alert.alert('Account Deleted', 'Your account has been deleted successfully.');
                      router.replace('/(auth)/splash');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account. Please contact support.');
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleShare = () => {
    // TODO: Implement app sharing
    Alert.alert('Share App', 'Check out LoyaltyApp - earn points for every purchase!');
  };

  const handleRateApp = () => {
    // TODO: Open app store for rating
    Alert.alert('Rate App', 'Thank you for using LoyaltyApp! Please rate us on the app store.');
  };

  const handleSupport = () => {
    Alert.alert(
      'Support Options',
      'How can we help you?',
      [
        {
          text: 'Email Support',
          onPress: () => Linking.openURL('mailto:support@loyaltyapp.com'),
        },
        {
          text: 'FAQ',
          onPress: () => Alert.alert('Coming Soon', 'FAQ section will be available soon.'),
        },
        {
          text: 'Live Chat',
          onPress: () => Alert.alert('Coming Soon', 'Live chat will be available soon.'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handlePrivacyPolicy = () => {
    // TODO: Open privacy policy
    Alert.alert('Privacy Policy', 'Privacy policy will open in browser.');
  };

  const handleTermsOfService = () => {
    // TODO: Open terms of service
    Alert.alert('Terms of Service', 'Terms of service will open in browser.');
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    settingKey: keyof AppSettings,
    disabled = false
  ) => (
    <View style={[styles.settingItem, disabled && styles.settingItemDisabled]}>
      <View style={styles.settingInfo}>
        <View style={styles.settingIcon}>
          {icon}
        </View>
        <View style={styles.settingDetails}>
          <Text style={[styles.settingTitle, disabled && styles.settingTitleDisabled]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, disabled && styles.settingDescriptionDisabled]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={settings[settingKey] as boolean}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{ false: Colors.border, true: `${Colors.primary}50` }}
        thumbColor={settings[settingKey] ? Colors.primary : Colors.textLight}
        disabled={disabled}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Appearance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Card>
            {renderSettingItem(
              settings.darkMode ? <Moon size={20} color={Colors.primary} /> : <Sun size={20} color={Colors.primary} />,
              'Dark Mode',
              'Use dark theme throughout the app',
              'darkMode'
            )}
            <TouchableOpacity style={styles.listItemButton} onPress={handleLanguageSelect}>
              <ListItem
                title="Language"
                subtitle={`Current: ${settings.language}`}
                leftElement={<Globe size={20} color={Colors.textSecondary} />}
                rightElement={<Text style={styles.valueText}>{settings.language}</Text>}
                style={{ borderBottomWidth: 0 }}
              />
            </TouchableOpacity>
          </Card>
        </View>

        {/* Security & Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security & Privacy</Text>
          <Card>
            {renderSettingItem(
              <Lock size={20} color={Colors.primary} />,
              'Biometric Login',
              'Use fingerprint or face ID to sign in',
              'biometricLogin'
            )}
            {renderSettingItem(
              <Database size={20} color={Colors.primary} />,
              'Auto Backup',
              'Automatically backup your data',
              'autoBackup'
            )}
            {renderSettingItem(
              <Shield size={20} color={Colors.error} />,
              'Opt out of Analytics',
              'Don\'t share usage data to improve the app',
              'analyticsOptOut'
            )}
            {renderSettingItem(
              <Smartphone size={20} color={Colors.primary} />,
              'Crash Reporting',
              'Help improve the app by sending crash reports',
              'crashReporting'
            )}
          </Card>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <Card padding="sm">
            <ListItem
              title="Export Data"
              subtitle="Download a copy of your personal data"
              leftElement={<Download size={20} color={Colors.textSecondary} />}
              onPress={handleExportData}
            />
            <ListItem
              title="Delete Account"
              subtitle="Permanently delete your account and data"
              leftElement={<Trash2 size={20} color={Colors.error} />}
              onPress={handleDeleteAccount}
              style={{ borderBottomWidth: 0 }}
            />
          </Card>
        </View>

        {/* Support & Feedback */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Feedback</Text>
          <Card padding="sm">
            <ListItem
              title="Help & Support"
              subtitle="Get help with using the app"
              leftElement={<HelpCircle size={20} color={Colors.textSecondary} />}
              onPress={handleSupport}
            />
            <ListItem
              title="Rate the App"
              subtitle="Rate us on the app store"
              leftElement={<Star size={20} color={Colors.textSecondary} />}
              onPress={handleRateApp}
            />
            <ListItem
              title="Share with Friends"
              subtitle="Tell others about LoyaltyApp"
              leftElement={<Share2 size={20} color={Colors.textSecondary} />}
              onPress={handleShare}
              style={{ borderBottomWidth: 0 }}
            />
          </Card>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <Card padding="sm">
            <ListItem
              title="Privacy Policy"
              subtitle="How we handle your data"
              leftElement={<Shield size={20} color={Colors.textSecondary} />}
              onPress={handlePrivacyPolicy}
            />
            <ListItem
              title="Terms of Service"
              subtitle="App usage terms and conditions"
              leftElement={<FileText size={20} color={Colors.textSecondary} />}
              onPress={handleTermsOfService}
              style={{ borderBottomWidth: 0 }}
            />
          </Card>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingItemDisabled: {
    opacity: 0.5,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingDetails: {
    flex: 1,
  },
  settingTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  settingTitleDisabled: {
    color: Colors.textLight,
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  settingDescriptionDisabled: {
    color: Colors.textLight,
  },
  listItemButton: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  valueText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '500',
  },
  appInfoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  appName: {
    ...Typography.title2,
    color: Colors.background,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  appVersion: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  appDescription: {
    ...Typography.caption,
    color: Colors.background,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 18,
  },
  appStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.bodyBold,
    color: Colors.background,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.background,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.background,
    opacity: 0.3,
    marginHorizontal: Spacing.md,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});
