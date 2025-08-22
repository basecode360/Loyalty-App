import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Clock, Settings } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { ListItem } from '../components/ui/ListItem';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../constants/Colors';
import { PointsTransaction } from '../types/api';
import * as api from '../services/api';

export default function PointsLedgerScreen() {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const data = await api.getPointsLedger();
      setTransactions(data);
    } catch (error) {
      console.error('Error loading points ledger:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
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
        return <TrendingUp size={20} color={Colors.accent} />;
      case 'redeemed':
        return <TrendingDown size={20} color={Colors.error} />;
      case 'expired':
        return <Clock size={20} color={Colors.warning} />;
      case 'adjustment':
        return <Settings size={20} color={Colors.textSecondary} />;
      default:
        return <TrendingUp size={20} color={Colors.textSecondary} />;
    }
  };

  const getTransactionColor = (type: PointsTransaction['type']) => {
    switch (type) {
      case 'earned':
        return Colors.accent;
      case 'redeemed':
        return Colors.error;
      case 'expired':
        return Colors.warning;
      case 'adjustment':
        return Colors.textSecondary;
      default:
        return Colors.textSecondary;
    }
  };

  const renderTransactionItem = ({ item }: { item: PointsTransaction }) => (
    <ListItem
      title={item.reason}
      subtitle={formatDate(item.createdAt)}
      leftElement={getTransactionIcon(item.type)}
      rightElement={
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              { color: getTransactionColor(item.type) },
            ]}
          >
            {item.type === 'earned' ? '+' : '-'}
            {Math.abs(item.amount)}
          </Text>
          <Text style={styles.balance}>
            Balance: {item.balanceAfter.toLocaleString()}
          </Text>
        </View>
      }
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <TrendingUp size={64} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>No Transactions Yet</Text>
      <Text style={styles.emptyDescription}>
        Start scanning receipts to see your points history here
      </Text>
    </View>
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

  const totalEarned = transactions
    .filter(t => t.type === 'earned')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRedeemed = transactions
    .filter(t => t.type === 'redeemed')
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <TrendingUp size={24} color={Colors.accent} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Total Earned</Text>
              <Text style={[styles.summaryValue, { color: Colors.accent }]}>
                +{totalEarned.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <TrendingDown size={24} color={Colors.error} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Total Redeemed</Text>
              <Text style={[styles.summaryValue, { color: Colors.error }]}>
                -{totalRedeemed.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    marginLeft: Spacing.md,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  summaryValue: {
    ...Typography.title3,
    fontWeight: '600',
  },
  listContent: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    marginTop: Spacing.lg,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 52, // Align with text
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...Typography.bodyBold,
    fontWeight: '600',
  },
  balance: {
    ...Typography.small,
    color: Colors.textLight,
    marginTop: Spacing.xs,
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