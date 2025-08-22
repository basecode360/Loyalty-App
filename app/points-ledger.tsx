import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
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
  Download
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
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Points Ledger</Text>
        <TouchableOpacity onPress={handleExport}>
          <Download size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Current Balance Card */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Current Balance</Text>
          <Text style={styles.balanceAmount}>
            {userProfile?.loyalty_points?.toLocaleString() || '0'}
          </Text>
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
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', transactions.length)}
        {renderFilterButton('earned', 'Earned', transactions.filter(t => t.type === 'earned').length)}
        {renderFilterButton('redeemed', 'Redeemed', transactions.filter(t => t.type === 'redeemed').length)}
        {renderFilterButton('expired', 'Expired', transactions.filter(t => t.type === 'expired').length)}
      </View>

      {/* Transactions List */}
      {filteredTransactions.length > 0 ? (
        <FlatList
          data={filteredTransactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
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
  balanceCard: {
    margin: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  },
  statValue: {
    ...Typography.bodyBold,
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.background,
    opacity: 0.3,
    marginHorizontal: Spacing.md,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  filterButton: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 8,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  filterButtonTextActive: {
    color: Colors.background,
  },
  filterCount: {
    ...Typography.small,
    color: Colors.textLight,
  },
  filterCountActive: {
    color: Colors.background,
    opacity: 0.8,
  },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
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
  },
  transactionDate: {
    ...Typography.caption,
    color: Colors.textSecondary,
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
    paddingHorizontal: Spacing.lg,
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