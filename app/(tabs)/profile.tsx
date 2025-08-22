import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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
  ChevronRight 
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { ListItem } from '../../components/ui/ListItem';
import { Colors, Typography, Spacing } from '../../constants/Colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

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
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {/* User Info Card */}
        <Card style={styles.userCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <User size={32} color={Colors.primary} />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'No email'}</Text>
              <Text style={styles.userPoints}>
                {user?.pointsBalance?.toLocaleString() || '0'} Points
              </Text>
            </View>
          </View>
        </Card>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <Card padding="sm">
            <ListItem
              title="Personal Information"
              subtitle="Name, email, phone, date of birth"
              leftElement={<User size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/profile-info')}
            />
            <ListItem
              title="Points Ledger"
              subtitle="View all point transactions"
              leftElement={<CreditCard size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/points-ledger')}
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
              subtitle="View and manage your devices"
              leftElement={<Smartphone size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/manage-devices')}
            />
            <ListItem
              title="Activity Log"
              subtitle="View account activity history"
              leftElement={<Activity size={20} color={Colors.textSecondary} />}
              rightElement={<ChevronRight size={20} color={Colors.textSecondary} />}
              onPress={() => router.push('/activity-log')}
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
              subtitle="Manage notification preferences"
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

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          <Card>
            <View style={styles.accountDetail}>
              <Text style={styles.detailLabel}>Member Since</Text>
              <Text style={styles.detailValue}>January 2024</Text>
            </View>
            <View style={styles.accountDetail}>
              <Text style={styles.detailLabel}>Date of Birth</Text>
              <Text style={styles.detailValue}>{formatDate(user?.dateOfBirth)}</Text>
            </View>
            <View style={styles.accountDetail}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{user?.phone || 'Not set'}</Text>
            </View>
          </Card>
        </View>

        {/* Sign Out Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>LoyaltyApp v1.0.0</Text>
        </View>
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
  header: {
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
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
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
  userEmail: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userPoints: {
    ...Typography.bodyBold,
    color: Colors.accent,
    fontWeight: '600',
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
  accountDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  detailValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
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
  },
});