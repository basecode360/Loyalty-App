// app/points-ledger.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Gift,
  Clock,
  Filter,
  Download,
  FileText,
  Share
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../constants/Colors';
import { PointsTransaction } from '../types/api';
import * as api from '../services/api';

export default function PointsLedgerScreen() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'earned' | 'redeemed' | 'expired'>('all');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      console.log('Loading points ledger...');
      const data = await api.getPointsLedger();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Mock data for development
      const mockTransactions: PointsTransaction[] = [
        {
          id: '1',
          type: 'earned',
          amount: 50,
          reason: 'Receipt scan - Grocery purchase',
          balanceAfter: 150,
          createdAt: new Date().toISOString(),
          receipt_id: 'receipt_1',
          promotion_id: null
        },
        {
          id: '2',
          type: 'earned',
          amount: 25,
          reason: 'Signup bonus',
          balanceAfter: 100,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          receipt_id: null,
          promotion_id: 'promo_1'
        },
        {
          id: '3',
          type: 'redeemed',
          amount: -75,
          reason: 'Gift card redemption',
          balanceAfter: 75,
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          receipt_id: null,
          promotion_id: null
        },
        {
          id: '4',
          type: 'earned',
          amount: 30,
          reason: 'Receipt scan - Restaurant bill',
          balanceAfter: 105,
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          receipt_id: 'receipt_2',
          promotion_id: null
        },
        {
          id: '5',
          type: 'expired',
          amount: -20,
          reason: 'Points expired after 1 year',
          balanceAfter: 85,
          createdAt: new Date(Date.now() - 345600000).toISOString(),
          receipt_id: null,
          promotion_id: null
        }
      ];
      setTransactions(mockTransactions);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (filter === 'all') return true;
    return transaction.type === filter;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getTransactionIcon = (type: PointsTransaction['type']) => {
    switch (type) {
      case 'earned':
        return <TrendingUp size={20} color={Colors.accent} />;
      case 'redeemed':
        return <Gift size={20} color={Colors.error} />;
      case 'expired':
        return <Clock size={20} color={Colors.textLight} />;
      case 'adjustment':
        return <TrendingDown size={20} color={Colors.textSecondary} />;
      default:
        return <TrendingUp size={20} color={Colors.textSecondary} />;
    }
  };

  const getTransactionColor = (type: PointsTransaction['type']) => {
    switch (type) {
      case 'earned':
        return Colors.accent;
      case 'redeemed':
      case 'expired':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getTotalStats = () => {
    const earned = transactions
      .filter(t => t.type === 'earned')
      .reduce((sum, t) => sum + t.amount, 0);
      
    const redeemed = transactions
      .filter(t => t.type === 'redeemed' || t.type === 'expired')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return { earned, redeemed };
  };

  const stats = getTotalStats();

  const renderTransactionItem = ({ item }: { item: PointsTransaction }) => (
    <Card style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <View style={styles.iconContainer}>
            {getTransactionIcon(item.type)}
          </View>
          <View style={styles.transactionDetails}>
            <Text style={styles.transactionReason}>{item.reason}</Text>
            <Text style={styles.transactionDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.transactionAmount}>
          <Text style={[
            styles.amountText,
            { color: getTransactionColor(item.type) }
          ]}>
            {item.type === 'earned' ? '+' : '-'}
            {Math.abs(item.amount)}
          </Text>
          <Text style={styles.balanceText}>
            Balance: {item.balanceAfter.toLocaleString()}
          </Text>
        </View>
      </View>
      
      {(item.receipt_id || item.promotion_id) && (
        <View style={styles.transactionMeta}>
          {item.receipt_id && (
            <Badge text="Receipt" variant="primary" />
          )}
          {item.promotion_id && (
            <Badge text="Promotion" variant="success" />
          )}
        </View>
      )}
    </Card>
  );

  const renderFilterButton = (filterType: typeof filter, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === filterType && styles.filterButtonActive
      ]}
      onPress={() => setFilter(filterType)}
    >
      <Text style={[
        styles.filterButtonText,
        filter === filterType && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
      <Text style={[
        styles.filterCount,
        filter === filterType && styles.filterCountActive
      ]}>
        {count}
      </Text>
    </TouchableOpacity>
  );

  const handleExport = () => {
    Alert.alert(
      'Export Points History',
      'Export your complete points transaction history',
      [
        {
          text: 'PDF Report',
          onPress: () => Alert.alert('Coming Soon', 'PDF export will be available soon.'),
        },
        {
          text: 'CSV Data',
          onPress: () => Alert.alert('Coming Soon', 'CSV export will be available soon.'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleShare = () => {
    Alert.alert('Share Points Summary', 'Share your points summary with others.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => console.log('Sharing points summary...') }
    ]);
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
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >   
        {/* Current Balance Card */}
        <Card style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>
              {userProfile?.loyalty_points?.toLocaleString() || '0'}
            </Text>
            <Text style={styles.pointsLabel}>points</Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={[styles.statValue, { color: Colors.accent }]}>
                +{stats.earned.toLocaleString()}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Redeemed</Text>
              <Text style={[styles.statValue, { color: Colors.error }]}>
                -{stats.redeemed.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>

        {/* Filter Buttons */}
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Filter Transactions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {renderFilterButton('all', 'All', transactions.length)}
            {renderFilterButton('earned', 'Earned', transactions.filter(t => t.type === 'earned').length)}
            {renderFilterButton('redeemed', 'Redeemed', transactions.filter(t => t.type === 'redeemed').length)}
            {renderFilterButton('expired', 'Expired', transactions.filter(t => t.type === 'expired').length)}
          </ScrollView>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>
            {filter === 'all' ? 'All Transactions' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Transactions`}
            <Text style={styles.transactionCount}> ({filteredTransactions.length})</Text>
          </Text>
          
          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {filteredTransactions.map((item) => (
                <View key={item.id}>
                  {renderTransactionItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <TrendingUp size={64} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyDescription}>
                {filter === 'all' 
                  ? 'Start earning points by scanning receipts!' 
                  : `No ${filter} transactions yet.`
                }
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
  balanceCard: {
    margin: Spacing.lg,
    marginTop: 0,
    backgroundColor: Colors.primary,
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    ...Typography.bodyBold,
    color: Colors.background,
    opacity: 0.9,
    marginBottom: Spacing.sm,
    fontWeight: '600',
    fontSize: 16,
  },
  balanceAmount: {
    ...Typography.title3,
    fontWeight: '400',
    color: Colors.background,
    fontSize: 36,
    marginBottom: Spacing.xs,
  },
  pointsLabel: {
    ...Typography.body,
    color: Colors.background,
    opacity: 0.9,
    fontSize: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.background,
    opacity: 0.8,
    marginBottom: Spacing.xs,
    fontSize: 12,
  },
  statValue: {
    ...Typography.title3,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.background,
    opacity: 0.3,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
    fontSize: 16,
  },
  filterSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
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
  transactionsSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  transactionCount: {
    color: Colors.textSecondary,
    fontWeight: '400',
  },
  transactionsList: {
    marginTop: Spacing.sm,
  },
  transactionCard: {
    marginBottom: Spacing.md,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionDetails: {
    flex: 1,
  },
  transactionReason: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontSize: 15,
  },
  transactionDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 13,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    ...Typography.title3,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  balanceText: {
    ...Typography.caption,
    color: Colors.textLight,
    fontSize: 11,
  },
  transactionMeta: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.lg,
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