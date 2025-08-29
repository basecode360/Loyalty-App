import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  LogIn,
  LogOut,
  UserPlus,
  Settings,
  Shield,
  Smartphone,
  CreditCard,
  Filter,
  Calendar,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface ActivityItem {
  id: string;
  type:
    | 'login'
    | 'logout'
    | 'signup'
    | 'profile_update'
    | 'password_change'
    | 'points_earned'
    | 'points_redeemed'
    | 'device_added'
    | 'security_event';
  description: string;
  timestamp: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export default function ActivityLogScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<
    'all' | 'security' | 'account' | 'points'
  >('all');

  useEffect(() => {
    loadActivityLog();
  }, []);

  const loadActivityLog = async () => {
    try {
      // Mock activity data - in production, fetch from your backend
      const mockActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'login',
          description: 'Signed in to account',
          timestamp: new Date().toISOString(),
          device: 'iPhone 14 Pro',
          location: 'Austin, USA',
          ipAddress: '192.168.1.100',
          riskLevel: 'low',
        },
        {
          id: '2',
          type: 'points_earned',
          description: 'Earned 50 points from receipt scan',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          device: 'iPhone 14 Pro',
          location: 'Dallas, USA',
          riskLevel: 'low',
        },
        {
          id: '3',
          type: 'profile_update',
          description: 'Updated personal information',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          device: 'iPhone 14 Pro',
          location: 'San Diego, USA',
          riskLevel: 'low',
        },
        {
          id: '4',
          type: 'password_change',
          description: 'Password was changed',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          device: 'MacBook Pro',
          location: 'Philadelphia, USA',
          ipAddress: '192.168.1.105',
          riskLevel: 'medium',
        },
        {
          id: '5',
          type: 'login',
          description: 'Signed in from new device',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          device: 'Unknown Device',
          location: 'Houston, USA',
          ipAddress: '203.124.45.67',
          riskLevel: 'high',
        },
        {
          id: '6',
          type: 'points_redeemed',
          description: 'Redeemed 100 points for gift card',
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          device: 'iPhone 14 Pro',
          location: 'Chicago, USA',
          riskLevel: 'low',
        },
        {
          id: '7',
          type: 'signup',
          description: 'Account created successfully',
          timestamp: new Date(Date.now() - 604800000).toISOString(),
          device: 'iPhone 14 Pro',
          location: 'Philadelphia, USA',
          ipAddress: '192.168.1.100',
          riskLevel: 'low',
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error('Error loading activity log:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadActivityLog();
    setRefreshing(false);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'login':
        return <LogIn size={20} color={Colors.accent} />;
      case 'logout':
        return <LogOut size={20} color={Colors.textSecondary} />;
      case 'signup':
        return <UserPlus size={20} color={Colors.primary} />;
      case 'profile_update':
        return <Settings size={20} color={Colors.primary} />;
      case 'password_change':
        return <Shield size={20} color={Colors.warning} />;
      case 'points_earned':
        return <CreditCard size={20} color={Colors.accent} />;
      case 'points_redeemed':
        return <CreditCard size={20} color={Colors.error} />;
      case 'device_added':
        return <Smartphone size={20} color={Colors.primary} />;
      case 'security_event':
        return <AlertCircle size={20} color={Colors.error} />;
      default:
        return <Shield size={20} color={Colors.textSecondary} />;
    }
  };

  const getRiskLevelColor = (riskLevel: ActivityItem['riskLevel']) => {
    switch (riskLevel) {
      case 'low':
        return Colors.accent;
      case 'medium':
        return Colors.warning;
      case 'high':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getRiskLevelText = (riskLevel: ActivityItem['riskLevel']) => {
    switch (riskLevel) {
      case 'low':
        return 'Normal';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
      default:
        return 'Unknown';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getFilteredActivities = () => {
    switch (filter) {
      case 'security':
        return activities.filter((a) =>
          [
            'login',
            'logout',
            'password_change',
            'device_added',
            'security_event',
          ].includes(a.type)
        );
      case 'account':
        return activities.filter((a) =>
          ['signup', 'profile_update', 'password_change'].includes(a.type)
        );
      case 'points':
        return activities.filter((a) =>
          ['points_earned', 'points_redeemed'].includes(a.type)
        );
      default:
        return activities;
    }
  };

  const filteredActivities = getFilteredActivities();

  const renderActivityItem = ({ item }: { item: ActivityItem }) => (
    <Card style={styles.activityCard}>
      <View style={styles.activityHeader}>
        <View style={styles.activityInfo}>
          <View style={styles.iconContainer}>{getActivityIcon(item.type)}</View>
          <View style={styles.activityDetails}>
            <Text style={styles.activityDescription}>{item.description}</Text>
            <View style={styles.activityMeta}>
              <Text style={styles.activityTime}>
                {formatTimestamp(item.timestamp)}
              </Text>
              {item.device && (
                <>
                  <Text style={styles.metaSeparator}>•</Text>
                  <Text style={styles.activityDevice}>{item.device}</Text>
                </>
              )}
            </View>
            {item.location && (
              <Text style={styles.activityLocation}>📍 {item.location}</Text>
            )}
          </View>
        </View>
        <View style={styles.activityStatus}>
          <Badge
            text={getRiskLevelText(item.riskLevel)}
            variant={
              item.riskLevel === 'low'
                ? 'success'
                : item.riskLevel === 'medium'
                ? 'warning'
                : 'error'
            }
          />
        </View>
      </View>

      {item.ipAddress && (
        <View style={styles.technicalDetails}>
          <Text style={styles.ipAddress}>IP: {item.ipAddress}</Text>
        </View>
      )}
    </Card>
  );

  const renderFilterButton = (
    filterType: typeof filter,
    label: string,
    count: number
  ) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === filterType && styles.filterButtonTextActive,
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.filterCount,
          filter === filterType && styles.filterCountActive,
        ]}
      >
        {count}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Security Summary */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Shield size={24} color={Colors.accent} />
            <Text style={styles.summaryTitle}>Security Summary</Text>
          </View>
          <Text style={styles.summaryDescription}>
            Last {activities.length} activities. Monitor your account for
            suspicious activity.
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.riskSummary}
          >
            <View style={styles.riskItem}>
              <View
                style={[
                  styles.riskIndicator,
                  { backgroundColor: Colors.error },
                ]}
              />
              <Text style={styles.riskText}>
                {activities.filter((a) => a.riskLevel === 'high').length} High
                Risk
              </Text>
            </View>
            <View style={styles.riskItem}>
              <View
                style={[
                  styles.riskIndicator,
                  { backgroundColor: Colors.warning },
                ]}
              />
              <Text style={styles.riskText}>
                {activities.filter((a) => a.riskLevel === 'medium').length}{' '}
                Medium Risk
              </Text>
            </View>
            <View style={styles.riskItem}>
              <View
                style={[
                  styles.riskIndicator,
                  { backgroundColor: Colors.accent },
                ]}
              />
              <Text style={styles.riskText}>
                {activities.filter((a) => a.riskLevel === 'low').length} Normal
              </Text>
            </View>
          </ScrollView>
        </Card>

        {/* Filter Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {renderFilterButton('all', 'All', activities.length)}
          {renderFilterButton(
            'security',
            'Security',
            activities.filter((a) =>
              [
                'login',
                'logout',
                'password_change',
                'device_added',
                'security_event',
              ].includes(a.type)
            ).length
          )}
          {renderFilterButton(
            'account',
            'Account',
            activities.filter((a) =>
              ['signup', 'profile_update', 'password_change'].includes(a.type)
            ).length
          )}
          {renderFilterButton(
            'points',
            'Points',
            activities.filter((a) =>
              ['points_earned', 'points_redeemed'].includes(a.type)
            ).length
          )}
        </ScrollView>

        {/* Activities List */}
        <View style={styles.listWrapper}>
          {filteredActivities.length > 0 ? (
            filteredActivities.map((item) => (
              <View key={item.id}>{renderActivityItem({ item })}</View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Calendar size={64} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No Activities Found</Text>
              <Text style={styles.emptyDescription}>
                {filter === 'all'
                  ? 'Your activity log will appear here.'
                  : `No ${filter} activities yet.`}
              </Text>
            </View>
          )}
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
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryCard: {
    margin: Spacing.lg,
    backgroundColor: `${Colors.accent}10`,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  summaryTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  summaryDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  riskSummary: {
    flexDirection: 'row',
    gap: Spacing.lg,
    paddingRight: Spacing.lg,
  },
  riskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 100,
  },
  riskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  riskText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterButton: {
    backgroundColor: Colors.background,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
    height: 50,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  filterButtonTextActive: {
    color: Colors.background,
  },
  filterCount: {
    fontSize: 10,
    color: Colors.textLight,
    textAlign: 'center',
  },
  filterCountActive: {
    color: Colors.background,
    opacity: 0.8,
  },
  listWrapper: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  activityCard: {
    marginBottom: Spacing.md,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  activityInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  activityDetails: {
    flex: 1,
  },
  activityDescription: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  activityTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  metaSeparator: {
    ...Typography.caption,
    color: Colors.textLight,
    marginHorizontal: Spacing.xs,
  },
  activityDevice: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  activityLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
  },
  activityStatus: {
    marginLeft: Spacing.sm,
  },
  technicalDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ipAddress: {
    ...Typography.small,
    color: Colors.textLight,
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
