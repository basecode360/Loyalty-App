import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Scan, Tag, TrendingUp } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui/Card';
import { ListItem } from '../../components/ui/ListItem';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../constants/Colors';
import { PointsTransaction } from '../../types/api';
import * as api from '../../services/api';

export default function HomeScreen() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [recentActivity, setRecentActivity] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const transactions = await api.getPointsLedger();
      setRecentActivity(transactions.slice(0, 5)); // Show last 5 transactions
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: PointsTransaction['type']) => {
    switch (type) {
      case 'earned':
        return '💰';
      case 'redeemed':
        return '🎁';
      case 'expired':
        return '⏰';
      case 'adjustment':
        return '⚖️';
      default:
        return '📝';
    }
  };

  // Get user's display name from userProfile
  const getUserDisplayName = () => {
    if (userProfile?.first_name && userProfile?.last_name) {
      return `${userProfile.first_name} ${userProfile.last_name}`;
    } else if (userProfile?.first_name) {
      return userProfile.first_name;
    } else if (userProfile?.full_name) {
      return userProfile.full_name;
    } else if (user?.email) {
      // Fallback to email name part
      return user.email.split('@')[0];
    }
    return 'User';
  };

  // Get user's points balance
  const getPointsBalance = () => {
    return userProfile?.loyalty_points || 0;
  };

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
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.userName}>{getUserDisplayName()}</Text>
          <Text style={styles.memberInfo}>
            Member since {userProfile?.created_at ? 
              new Date(userProfile.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long' 
              }) : 
              'Recently'
            }
          </Text>
        </View>

        {/* Points Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceContent}>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Your Points Balance</Text>
              <Text style={styles.balanceAmount}>
                {getPointsBalance().toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceIcon}>
              <TrendingUp size={32} color={Colors.accent} />
            </View>
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/scan')}
            >
              <Scan size={24} color={Colors.primary} />
              <Text style={styles.actionText}>Scan Receipt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/promotions')}
            >
              <Tag size={24} color={Colors.primary} />
              <Text style={styles.actionText}>View Promotions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/points-ledger')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <Card padding="sm">
            {recentActivity.length > 0 ? (
              recentActivity.map((transaction, index) => (
                <ListItem
                  key={transaction.id}
                  title={transaction.reason}
                  subtitle={formatDate(transaction.createdAt)}
                  leftElement={
                    <Text style={styles.transactionIcon}>
                      {getTransactionIcon(transaction.type)}
                    </Text>
                  }
                  rightElement={
                    <View style={styles.amountContainer}>
                      <Text
                        style={[
                          styles.amount,
                          transaction.type === 'earned'
                            ? styles.amountPositive
                            : styles.amountNegative,
                        ]}
                      >
                        {transaction.type === 'earned' ? '+' : '-'}
                        {Math.abs(transaction.amount)}
                      </Text>
                      <Text style={styles.balance}>
                        {transaction.balanceAfter.toLocaleString()}
                      </Text>
                    </View>
                  }
                  style={
                    index === recentActivity.length - 1
                      ? { borderBottomWidth: 0 }
                      : undefined
                  }
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No recent activity</Text>
                <Text style={styles.emptySubtext}>
                  Start scanning receipts to earn points!
                </Text>
              </View>
            )}
          </Card>
        </View>

        {/* User Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <Card>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{getPointsBalance()}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userProfile?.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
                <Text style={styles.statLabel}>Account Status</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {userProfile?.country || 'Not Set'}
                </Text>
                <Text style={styles.statLabel}>Location</Text>
              </View>
            </View>
          </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  userName: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  memberInfo: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  balanceCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  balanceContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.8,
    marginBottom: Spacing.xs,
  },
  balanceAmount: {
    ...Typography.title1,
    color: Colors.background,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  balanceSubtext: {
    ...Typography.caption,
    color: Colors.background,
    opacity: 0.9,
  },
  balanceIcon: {
    opacity: 0.8,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
  },
  seeAllText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
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
  },
  actionText: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  transactionIcon: {
    fontSize: 24,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...Typography.bodyBold,
    fontWeight: '600',
  },
  amountPositive: {
    color: Colors.accent,
  },
  amountNegative: {
    color: Colors.error,
  },
  balance: {
    ...Typography.small,
    color: Colors.textLight,
    marginTop: Spacing.xs,
  },
  emptyState: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
});