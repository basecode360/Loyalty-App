import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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
  Calendar
} from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { ListItem } from '../../components/ui/ListItem';
import { Colors, Typography, Spacing } from '../../constants/Colors';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, userProfile, signOut } = useAuth();

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
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
              </View>
              <Text style={styles.userPoints}>
                {getUserPoints().toLocaleString()} Points
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
              subtitle={`Marketing: ${userProfile?.agree_to_marketing ? 'Enabled' : 'Disabled'}`}
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
                {userProfile?.email_verified ? 'Verified' : 'Not Verified'}
              </Text>
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
    paddingBottom: -42,
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
  },
  userPoints: {
    ...Typography.bodyBold,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: Spacing.xs,
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
});