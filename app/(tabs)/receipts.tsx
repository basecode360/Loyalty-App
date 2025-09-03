// app/(tabs)/receipts.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Receipt as ReceiptIcon, Calendar, DollarSign, Award, TrendingUp } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../constants/Colors';
import { Receipt } from '../../types/api';
import * as api from '../../services/api';

export default function ReceiptsScreen() {
  const router = useRouter();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    try {
      const data = await api.getReceipts();
      setReceipts(data);
    } catch (error) {
      console.error('Error loading receipts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = (status: Receipt['status']) => {
    switch (status) {
      case 'approved':
        return 'approved';
      case 'rejected':
        return 'rejected';
      case 'processing':
        return 'processing';
      case 'queued':
        return 'queued';
      case 'duplicate':
        return 'duplicate';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = (status: Receipt['status']) => {
    switch (status) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'processing':
        return '⏳';
      case 'queued':
        return '⏰';
      case 'duplicate':
        return '📄';
      default:
        return '📝';
    }
  };

  const getReceiptStats = () => {
    const approved = receipts.filter(r => r.status === 'approved').length;
    const totalPoints = receipts
      .filter(r => r.status === 'approved')
      .reduce((sum, r) => sum + (r.pointsAwarded || 0), 0);
    const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);

    return { approved, totalPoints, totalSpent };
  };

  const renderReceiptItem = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      onPress={() => router.push({
        pathname: '/receipt-detail',
        params: { receiptId: item.id }
      })}
      activeOpacity={0.7}
    >
      <Card style={styles.receiptCard}>
        <View style={styles.receiptHeader}>
          <View style={styles.receiptInfo}>
            <View style={styles.retailerRow}>
              <View style={styles.receiptIconContainer}>
                <ReceiptIcon size={20} color={Colors.primary} />
              </View>
              <View style={styles.receiptTitleContainer}>
                <Text style={styles.retailerName} numberOfLines={1}>
                  {item.retailer}
                </Text>
                <Text style={styles.receiptId} numberOfLines={1}>
                  Receipt #{item.id.slice(-8).toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.statusContainer}>
              <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
              <Badge 
                text={item.status.charAt(0).toUpperCase() + item.status.slice(1)} 
                variant={getStatusColor(item.status)} 
              />
            </View>
          </View>
        </View>

        <View style={styles.receiptDetails}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <Calendar size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.detailText}>
              {formatDate(item.purchaseDate)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
              <DollarSign size={16} color={Colors.textSecondary} />
            </View>
            <Text style={styles.detailText}>
              {formatCurrency(item.total)}
            </Text>
          </View>
        </View>

        <View style={styles.pointsRow}>
          <View style={styles.pointsInfo}>
            <Award size={16} color={item.status === 'approved' ? Colors.accent : Colors.textLight} />
            <Text style={styles.pointsLabel}>Points Awarded</Text>
          </View>
          <Text style={[
            styles.pointsAmount,
            item.status === 'approved' ? styles.pointsApproved : styles.pointsPending
          ]}>
            {item.status === 'approved' ? `+${item.pointsAwarded}` : 'Pending'}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <ReceiptIcon size={64} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Receipts Yet</Text>
      <Text style={styles.emptyDescription}>
        Start scanning receipts to earn points and track your purchases
      </Text>
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/(tabs)/scan')}
        activeOpacity={0.8}
      >
        <ReceiptIcon size={20} color={Colors.background} />
        <Text style={styles.scanButtonText}>Scan Your First Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  const renderListHeader = () => {
    if (receipts.length === 0) return null;
    
    const stats = getReceiptStats();
    
    return (
      <View style={styles.statsSection}>
        <Card style={styles.statsCard}>
          <Text style={styles.statsTitle}>Receipt Summary</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <ReceiptIcon size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{stats.approved}</Text>
              <Text style={styles.statLabel}>Approved</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <Award size={20} color={Colors.accent} />
              </View>
              <Text style={styles.statValue}>{stats.totalPoints.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Points Earned</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <View style={styles.statIconContainer}>
                <TrendingUp size={20} color={Colors.primary} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(stats.totalSpent)}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </Card>
      </View>
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
        <Text style={styles.title}>My Receipts</Text>
        <Text style={styles.subtitle}>
          {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} submitted
        </Text>
      </View>

      <FlatList
        data={receipts}
        renderItem={renderReceiptItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          receipts.length === 0 && styles.emptyListContent
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
        ListHeaderComponent={renderListHeader}
        ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: -42,
    backgroundColor: Colors.backgroundSecondary,
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
  title: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  
  // List Styles
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  itemSeparator: {
    height: 12,
  },
  
  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  statsCard: {
    padding: 20,
    borderRadius: 16,
  },
  statsTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
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
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  
  // Receipt Card Styles
  receiptCard: {
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  receiptHeader: {
    marginBottom: 16,
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  retailerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  receiptIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receiptTitleContainer: {
    flex: 1,
  },
  retailerName: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  receiptId: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 16,
    marginBottom: 4,
  },
  
  // Receipt Details
  receiptDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIconContainer: {
    width: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 15,
    marginLeft: 8,
  },
  
  // Points Row
  pointsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pointsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 15,
    marginLeft: 8,
  },
  pointsAmount: {
    ...Typography.bodyBold,
    fontWeight: '700',
    fontSize: 16,
  },
  pointsApproved: {
    color: Colors.accent,
  },
  pointsPending: {
    color: Colors.textLight,
  },
  
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    opacity: 0.8,
  },
  emptyTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  scanButtonText: {
    ...Typography.bodyBold,
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});