// app/(tabs)/index.tsx
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
import { NicheLogo } from '../../components/ui/NicheLogo';
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
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Welcome back!</Text>
              <Text style={styles.userName}>{getUserDisplayName()}</Text>
            </View>
            <NicheLogo size="small" />
          </View>
        </View>

        {/* Points Balance Card */}
        <View style={styles.cardContainer}>
          <Card style={styles.balanceCard}>
            <View style={styles.balanceContent}>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Your Points Balance</Text>
                <Text style={styles.balanceAmount}>
                  {getPointsBalance().toLocaleString()}
                </Text>
                <Text style={styles.balanceSubtext}>Points earned</Text>
              </View>
              <View style={styles.balanceIcon}>
                <TrendingUp size={32} color={Colors.background} />
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/scan')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Scan size={28} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>Scan Receipt</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/promotions')}
              activeOpacity={0.7}
            >
              <View style={styles.actionIconContainer}>
                <Tag size={28} color={Colors.primary} />
              </View>
              <Text style={styles.actionText}>View Promotions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity 
              onPress={() => router.push('/points-ledger')}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <Card style={styles.activityCard}>
            {recentActivity.length > 0 ? (
              recentActivity.map((transaction, index) => (
                <ListItem
                  key={transaction.id}
                  title={transaction.reason}
                  subtitle={formatDate(transaction.createdAt)}
                  leftElement={
                    <View style={styles.transactionIconContainer}>
                      <Text style={styles.transactionIcon}>
                        {getTransactionIcon(transaction.type)}
                      </Text>
                    </View>
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
                        Balance: {transaction.balanceAfter.toLocaleString()}
                      </Text>
                    </View>
                  }
                  style={[
                    styles.listItem,
                    index === recentActivity.length - 1 && styles.lastListItem
                  ]}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📱</Text>
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
          <Card style={styles.statsCard}>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {getPointsBalance().toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Text style={[
                  styles.statValue,
                  userProfile?.status === 'active' ? styles.activeStatus : styles.inactiveStatus
                ]}>
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

        {/* Bottom Spacer */}
        <View style={styles.bottomSpacer} />
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.background,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 4,
  },
  
  // Card Container
  cardContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  
  // Balance Card Styles
  balanceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    opacity: 0.9,
    fontSize: 16,
    marginBottom: 8,
  },
  balanceAmount: {
    ...Typography.title1,
    color: Colors.background,
    fontWeight: '800',
    fontSize: 32,
    marginBottom: 4,
  },
  balanceSubtext: {
    ...Typography.caption,
    color: Colors.background,
    opacity: 0.8,
    fontSize: 14,
  },
  balanceIcon: {
    opacity: 0.8,
    marginLeft: 16,
  },
  
  // Section Styles
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 20,
  },
  seeAllText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 16,
  },
  
  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minHeight: 100,
  },
  actionIconContainer: {
    marginBottom: 12,
  },
  actionText: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  
  // Activity Card
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  
  // Transaction Styles
  transactionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIcon: {
    fontSize: 20,
  },
  listItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  lastListItem: {
    borderBottomWidth: 0,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...Typography.bodyBold,
    fontWeight: '700',
    fontSize: 16,
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
    fontSize: 12,
    marginTop: 4,
  },
  
  // Empty State
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.textLight,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Stats Card
  statsCard: {
    borderRadius: 16,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  activeStatus: {
    color: Colors.accent,
  },
  inactiveStatus: {
    color: Colors.error,
  },
  
  // Bottom Spacer
  bottomSpacer: {
    height: 20,
  },
});