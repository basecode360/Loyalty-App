import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bell,
  Mail,
  Smartphone,
  Gift,
  TrendingUp,
  Shield,
  Clock,
  Volume2
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  pointsUpdates: boolean;
  receiptProcessing: boolean;
  promotions: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { userProfile, updateProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: false,
    pointsUpdates: true,
    receiptProcessing: true,
    promotions: true,
    securityAlerts: true,
    weeklyDigest: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  useEffect(() => {
    // Load existing notification preferences
    if (userProfile) {
      setSettings(prev => ({
        ...prev,
        marketingEmails: userProfile.agree_to_marketing || false,
      }));
    }
  }, [userProfile]);

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));

      // If marketing emails changed, update user profile
      if (key === 'marketingEmails') {
        setIsLoading(true);
        await updateProfile({ agreeToMarketing: value });
        setIsLoading(false);
      }

      // TODO: Save other notification preferences to backend
      console.log('Notification setting updated:', key, value);

    } catch (error) {
      console.error('Error updating notification setting:', error);
      // Revert the change
      setSettings(prev => ({ ...prev, [key]: !value }));
      Alert.alert('Error', 'Failed to update notification setting. Please try again.');
    }
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    title: string,
    description: string,
    settingKey: keyof NotificationSettings,
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
        value={settings[settingKey]}
        onValueChange={(value) => updateSetting(settingKey, value)}
        trackColor={{ false: Colors.border, true: `${Colors.primary}50` }}
        thumbColor={settings[settingKey] ? Colors.primary : Colors.textLight}
        disabled={disabled || isLoading}
      />
    </View>
  );

  const handleTestNotification = () => {
    Alert.alert(
      '🔔 Test Notification',
      'This is how notifications will appear on your device.',
      [{ text: 'OK' }]
    );
  };

  const handleManagePermissions = () => {
    Alert.alert(
      'Notification Permissions',
      'To change system notification permissions, go to your device Settings > Apps > LoyaltyApp > Notifications.',
      [
        {
          text: 'Open Settings',
          onPress: () => {
            // TODO: Open device settings
            console.log('Opening device settings...');
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={handleTestNotification}>
          <Bell size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Card style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
            <Bell size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Send Test Notification</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleManagePermissions}>
            <Shield size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Manage Permissions</Text>
          </TouchableOpacity>
        </Card>

        {/* Delivery Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Methods</Text>
          <Card>
            {renderSettingItem(
              <Smartphone size={20} color={Colors.primary} />,
              'Push Notifications',
              'Receive notifications on this device',
              'pushNotifications'
            )}
            {renderSettingItem(
              <Mail size={20} color={Colors.primary} />,
              'Email Notifications',
              'Receive notifications via email',
              'emailNotifications'
            )}
            {renderSettingItem(
              <Smartphone size={20} color={Colors.primary} />,
              'SMS Notifications',
              'Receive notifications via text message',
              'smsNotifications',
              true // Disabled for now
            )}
          </Card>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What to Notify</Text>
          <Card>
            {renderSettingItem(
              <TrendingUp size={20} color={Colors.accent} />,
              'Points Updates',
              'When you earn or redeem points',
              'pointsUpdates'
            )}
            {renderSettingItem(
              <Clock size={20} color={Colors.primary} />,
              'Receipt Processing',
              'Status updates for submitted receipts',
              'receiptProcessing'
            )}
            {renderSettingItem(
              <Gift size={20} color={Colors.primary} />,
              'Promotions & Offers',
              'Special deals and bonus point opportunities',
              'promotions'
            )}
            {renderSettingItem(
              <Shield size={20} color={Colors.error} />,
              'Security Alerts',
              'Login attempts and account security',
              'securityAlerts'
            )}
            {renderSettingItem(
              <Mail size={20} color={Colors.primary} />,
              'Marketing Emails',
              'Promotional content and product updates',
              'marketingEmails'
            )}
            {renderSettingItem(
              <Bell size={20} color={Colors.primary} />,
              'Weekly Digest',
              'Summary of your weekly activity',
              'weeklyDigest'
            )}
          </Card>
        </View>

        {/* Sound & Vibration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sound & Vibration</Text>
          <Card>
            {renderSettingItem(
              <Volume2 size={20} color={Colors.primary} />,
              'Sound',
              'Play sound for notifications',
              'soundEnabled'
            )}
            {renderSettingItem(
              <Smartphone size={20} color={Colors.primary} />,
              'Vibration',
              'Vibrate for notifications',
              'vibrationEnabled'
            )}
          </Card>
        </View>

        {/* Privacy Notice */}
        <Card style={styles.privacyCard}>
          <View style={styles.privacyHeader}>
            <Shield size={20} color={Colors.accent} />
            <Text style={styles.privacyTitle}>Privacy Notice</Text>
          </View>
          <Text style={styles.privacyText}>
            We respect your privacy. You can change these settings anytime.
            We'll never share your personal information with third parties without your consent.
          </Text>
        </Card>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Notification Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Active Methods</Text>
              <Text style={styles.summaryValue}>
                {[settings.pushNotifications, settings.emailNotifications, settings.smsNotifications]
                  .filter(Boolean).length} / 3
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Notification Types</Text>
              <Text style={styles.summaryValue}>
                {[
                  settings.pointsUpdates,
                  settings.receiptProcessing,
                  settings.promotions,
                  settings.securityAlerts,
                  settings.marketingEmails,
                  settings.weeklyDigest
                ].filter(Boolean).length} / 6
              </Text>
            </View>
          </View>
        </Card>

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
  actionsCard: {
    margin: Spacing.lg,
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  actionButtonText: {
    ...Typography.bodyBold,
    color: Colors.primary,
    marginLeft: Spacing.sm,
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
  privacyCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: `${Colors.accent}10`,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  privacyTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  privacyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  summaryCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    ...Typography.title3,
    color: Colors.primary,
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});