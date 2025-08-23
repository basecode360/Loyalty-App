import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
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

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
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
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
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

    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    // Notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userProfile]);

  // Function to register for push notifications
  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Push notifications need to be enabled in settings to send test notifications.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open device settings
                if (Platform.OS === 'ios') {
                  Notifications.openNotificationSettingsAsync();
                }
              },
            },
          ]
        );
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
    } else {
      Alert.alert('Error', 'Must use physical device for Push Notifications');
    }

    return token;
  }

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      setSettings(prev => ({ ...prev, [key]: value }));

      // If push notifications are being enabled, register for notifications
      if (key === 'pushNotifications' && value) {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setExpoPushToken(token);
        }
      }

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

  const handleTestNotification = async () => {
    if (!settings.pushNotifications) {
      Alert.alert(
        'Push Notifications Disabled',
        'Please enable Push Notifications first to send a test notification.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Enable',
            onPress: () => updateSetting('pushNotifications', true),
          },
        ]
      );
      return;
    }

    try {
      // Check if we have permission
      const { status } = await Notifications.getPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Push notification permission is required. Please enable it in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Schedule a local notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🔔 Push Notification Test",
          body: 'This is a test notification from your Loyalty App! Push notifications are working correctly.',
          data: { 
            type: 'test',
            timestamp: new Date().toISOString(),
          },
          sound: settings.soundEnabled ? 'default' : false,
        },
        trigger: { seconds: 1 },
      });

      // Show success message
      Alert.alert(
        '✅ Test Sent!',
        'A test notification will appear in 1 second. Check your notification panel if you don\'t see it.',
        [{ text: 'OK' }]
      );

    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert(
        'Error',
        'Failed to send test notification. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleManagePermissions = async () => {
    try {
      await Notifications.openNotificationSettingsAsync();
    } catch (error) {
      Alert.alert(
        'Notification Permissions',
        'To change system notification permissions, go to your device Settings > Apps > LoyaltyApp > Notifications.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleTestNotification}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Bell size={24} color={Colors.primary} />
              </View>
              <Text style={styles.actionTitle}>Test Notification</Text>
              <Text style={styles.actionDescription}>Send a sample notification</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleManagePermissions}
              activeOpacity={0.7}
            >
              <View style={styles.actionIcon}>
                <Shield size={24} color={Colors.accent} />
              </View>
              <Text style={styles.actionTitle}>Manage Permissions</Text>
              <Text style={styles.actionDescription}>Configure system settings</Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <Text style={styles.privacyTitle}>Privacy & Control</Text>
          </View>
          <Text style={styles.privacyText}>
            You have full control over your notification preferences. These settings are saved securely and can be changed at any time. We respect your privacy and will never send unwanted notifications.
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  quickActionsSection: {
    margin: Spacing.lg,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  actionDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
  section: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
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
    fontSize: 15,
  },
  settingTitleDisabled: {
    color: Colors.textLight,
  },
  settingDescription: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
    fontSize: 13,
  },
  settingDescriptionDisabled: {
    color: Colors.textLight,
  },
  privacyCard: {
    marginHorizontal: Spacing.lg,
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
    fontWeight: '600',
  },
  privacyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
});