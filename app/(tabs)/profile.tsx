// app/(tabs)/profile.tsx - UPDATED VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Settings, 
  Smartphone, 
  Activity, 
  Bell, 
  CreditCard, 
  LogOut,
  ChevronRight,
  Mail,
  MapPin,
  Calendar,
  Phone,
  Shield,
  Globe,
  RefreshCw,
  Edit
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { ListItem } from '../../components/ui/ListItem';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../constants/Colors';
import { PushNotificationService } from '../../services/pushNotifications';
import * as api from '../../services/api';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  
  // States for additional data
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deviceCount, setDeviceCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);
  const [pushToken, setPushToken] = useState(null);
  const [notificationSettings, setNotificationSettings] = useState({
    receipts: true,
    marketing: false,
    promotions: true,
  });

  useEffect(() => {
    loadProfileData();
    initializePushNotifications();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Load devices count
      const devices = await api.getDevices();
      setDeviceCount(devices.length);
      
      // Load activity count
      const activities = await api.getActivityLog();
      setActivityCount(activities.length);
      
      // Load notification preferences
      if (userProfile?.notification_preferences) {
        setNotificationSettings({
          receipts: userProfile.notification_preferences.receipts !== false,
          marketing: userProfile.notification_preferences.marketing === true,
          promotions: userProfile.notification_preferences.promotions !== false,
        });
      }
      
      // Refresh profile
      if (refreshProfile) {
        await refreshProfile();
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializePushNotifications = async () => {
    try {
      const token = await PushNotificationService.registerForPushNotifications();
      if (token) {
        setPushToken(token);
        await PushNotificationService.savePushTokenToDatabase(token);
      }
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
    setRefreshing(false);
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...notificationSettings, [key]: value };
      setNotificationSettings(newSettings);
      
      // Save to backend
      await api.updateProfileSettings({
        notification_preferences: newSettings
      });
      
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      setNotificationSettings(notificationSettings);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/splash');
            } catch (error) {
              console.error('Sign out error:', error);
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Get user's display name
  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile?.first_name) {
      return userProfile.first_name;
    } else if (userProfile?.full_name) {
      return userProfile.full_name;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get user's email
  const getUserEmail = () => {
    return userProfile?.email || user?.email || 'No email';
  };

  // Get user's points
  const getUserPoints = () => {
    return userProfile?.loyalty_points || 0;
  };

  // Get user's initials for avatar
  const getUserInitials = () => {
    const name = getUserDisplayName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header with Edit Button */}
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Edit size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              {userProfile?.profile_picture_url ? (
                <Image 
                  source={{ uri: userProfile.profile_picture_url }} 
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarText}>{getUserInitials()}</Text>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
              <View style={styles.emailRow}>
                <Mail size={16} color={Colors.textSecondary} />
                <Text style={styles.userEmail}>{getUserEmail()}</Text>
                {userProfile?.email_verified && (
                  <Text style={styles.verifiedBadge}>✓</Text>
                )}
              </View>
              <Text style={styles.userPoints}>
                {getUserPoints().toLocaleString()} Points
              </Text>
              {/* Status indicator */}
              <View style={styles.statusRow}>
                <View style={[
                  styles.statusDot,
                  userProfile?.status === 'active' ? styles.statusActive : styles.statusInactive
                ]} />
                <Text style={styles.statusText}>
                  {userProfile?.status === 'active' ? 'Active Member' : 'Inactive'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Quick Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Settings</Text>
          <Card padding="sm">
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Bell size={20} color={Colors.primary} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationLabel}>Receipt Updates</Text>
                  <Text style={styles.notificationSubtext}>Get notified when receipts are processed</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.receipts}
                onValueChange={(value) => handleNotificationToggle('receipts', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.background}
              />
            </View>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Globe size={20} color={Colors.primary} />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationLabel}>Marketing</Text>
                  <Text style={styles.notificationSubtext}>Promotional offers and news</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.marketing}
                onValueChange={(value) => handleNotificationToggle('marketing', value)}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.background}
              />
            </View>
          </Card>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card padding="sm">
            <ListItem
              title="Personal Information"
              subtitle={`${userProfile?.first_name || 'Not set'} • ${userProfile?.gender || 'Not set'}`}
              leftElement={<User size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/profile-info')}
            />
            <ListItem
              title="Points Ledger"
              subtitle={`${getUserPoints()} total points`}
              leftElement={<CreditCard size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/points-ledger')}
            />
            <ListItem
              title="Phone Verification"
              subtitle={userProfile?.phone_verified ? `${userProfile?.phone} ✓` : 'Not verified'}
              leftElement={<Phone size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/phone-verification')}
              style={{ borderBottomWidth: 0 }}
            />
          </Card>
        </View>

        {/* Device & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Device & Security</Text>
          <Card padding="sm">
            <ListItem
              title="Manage Devices"
              subtitle={`${deviceCount} device${deviceCount !== 1 ? 's' : ''} connected`}
              leftElement={<Smartphone size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/manage-devices')}
            />
            <ListItem
              title="Activity Log"
              subtitle={`${activityCount} recent activities`}
              leftElement={<Activity size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/activity-log')}
            />
            <ListItem
              title="Privacy & Security"
              subtitle="Account security settings"
              leftElement={<Shield size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/privacy-settings')}
              style={{ borderBottomWidth: 0 }}
            />
          </Card>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <Card padding="sm">
            <ListItem
              title="Notifications"
              subtitle={`Push: ${pushToken ? 'Enabled' : 'Disabled'} • Marketing: ${notificationSettings.marketing ? 'On' : 'Off'}`}
              leftElement={<Bell size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/notifications')}
            />
            <ListItem
              title="App Settings"
              subtitle="Preferences and privacy settings"
              leftElement={<Settings size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/app-settings')}
              style={{ borderBottomWidth: 0 }}
            />
          </Card>
        </View>

        {/* Account Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Card>
            <View style={styles.accountDetail}>
              <View style={styles.detailRow}>
                <Calendar size={16} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Member Since</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(userProfile?.created_at)}
              </Text>
            </View>
            
            <View style={styles.accountDetail}>
              <View style={styles.detailRow}>
                <User size={16} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Date of Birth</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatDate(userProfile?.date_of_birth)}
              </Text>
            </View>

            <View style={styles.accountDetail}>
              <View style={styles.detailRow}>
                <MapPin size={16} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Location</Text>
              </View>
              <Text style={styles.detailValue}>
                {userProfile?.city && userProfile?.country 
                  ? `${userProfile.city}, ${userProfile.country}`
                  : userProfile?.country || 'Not set'
                }
              </Text>
            </View>

            <View style={styles.accountDetail}>
              <View style={styles.detailRow}>
                <Mail size={16} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Email Status</Text>
              </View>
              <Text style={[
                styles.detailValue,
                { color: userProfile?.email_verified ? Colors.accent : Colors.error }
              ]}>
                {userProfile?.email_verified ? 'Verified ✓' : 'Not Verified'}
              </Text>
            </View>

            <View style={styles.accountDetail}>
              <View style={styles.detailRow}>
                <Phone size={16} color={Colors.textSecondary} />
                <Text style={styles.detailLabel}>Phone Status</Text>
              </View>
              <Text style={[
                styles.detailValue,
                { color: userProfile?.phone_verified ? Colors.accent : Colors.error }
              ]}>
                {userProfile?.phone_verified ? 'Verified ✓' : 'Not Verified'}
              </Text>
            </View>
          </Card>
        </View>

        {/* Loading state */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size={24} />
            <Text style={styles.loadingText}>Loading profile data...</Text>
          </View>
        )}

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>niche. v1.0.0</Text>
          {pushToken && (
            <Text style={styles.footerSubtext}>Push notifications enabled</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Updated styles with new components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: -42,
    backgroundColor: Colors.backgroundSecondary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  userCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarText: {
    ...Typography.title3,
    color: Colors.background,
    fontWeight: '700',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  verifiedBadge: {
    color: Colors.accent,
    fontWeight: '600',
    marginLeft: 4,
  },
  userPoints: {
    ...Typography.bodyBold,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusActive: {
    backgroundColor: Colors.accent,
  },
  statusInactive: {
    backgroundColor: Colors.error,
  },
  statusText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  section: {
    marginTop: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  // Notification settings
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  notificationLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  notificationSubtext: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  accountDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.xs,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
    maxWidth: '50%',
    textAlign: 'right',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  loadingText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  signOutText: {
    ...Typography.bodyBold,
    color: Colors.error,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  footerText: {
    ...Typography.caption,
    color: Colors.textLight,
    marginBottom: Spacing.xs,
  },
  footerSubtext: {
    ...Typography.caption,
    color: Colors.textLight,
    fontSize: 10,
  },
});