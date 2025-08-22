import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, DollarSign, Store, Award, Eye } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../constants/Colors';
import { Receipt } from '../types/api';
import * as api from '../services/api';

export default function ReceiptDetailScreen() {
  const { receiptId } = useLocalSearchParams<{ receiptId: string }>();
  const router = useRouter();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadReceiptDetail();
  }, [receiptId]);

  const loadReceiptDetail = async () => {
    try {
      // Mock receipt detail - in real app, fetch by ID
      const mockReceipt: Receipt = {
        id: receiptId || '1',
        retailer: 'Walmart',
        purchaseDate: '2024-01-15T10:30:00Z',
        total: 89.45,
        pointsAwarded: 89,
        ocrConfidence: 0.98,
        status: 'approved',
        imageUrl: 'https://images.pexels.com/photos/5632371/pexels-photo-5632371.jpeg',
        createdAt: '2024-01-15T10:35:00Z',
      };
      setReceipt(mockReceipt);
    } catch (error) {
      console.error('Error loading receipt detail:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const getStatusDescription = (status: Receipt['status']) => {
    switch (status) {
      case 'approved':
        return 'Receipt has been approved and points awarded';
      case 'rejected':
        return 'Receipt was rejected due to unclear image or invalid data';
      case 'processing':
        return 'Receipt is being processed by our OCR system';
      case 'queued':
        return 'Receipt is queued for processing';
      case 'duplicate':
        return 'This receipt has already been submitted';
      default:
        return 'Status unknown';
    }
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

  if (!receipt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Receipt not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Badge 
              text={receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)} 
              variant={getStatusColor(receipt.status)} 
            />
            <Text style={styles.statusDescription}>
              {getStatusDescription(receipt.status)}
            </Text>
          </View>
        </Card>

        {/* Receipt Details */}
        <Card style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Store size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Retailer</Text>
              <Text style={styles.detailValue}>{receipt.retailer}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Calendar size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Purchase Date</Text>
              <Text style={styles.detailValue}>{formatDate(receipt.purchaseDate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <DollarSign size={20} color={Colors.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Total Amount</Text>
              <Text style={styles.detailValue}>{formatCurrency(receipt.total)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Award size={20} color={Colors.accent} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Points Awarded</Text>
              <Text style={[styles.detailValue, { color: Colors.accent }]}>
                {receipt.status === 'approved' ? receipt.pointsAwarded : 'Pending'}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Eye size={20} color={Colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>OCR Confidence</Text>
              <Text style={styles.detailValue}>
                {Math.round(receipt.ocrConfidence * 100)}%
              </Text>
            </View>
          </View>
        </Card>

        {/* Receipt Image */}
        {receipt.imageUrl && (
          <Card style={styles.imageCard}>
            <Text style={styles.imageTitle}>Receipt Image</Text>
            <TouchableOpacity style={styles.imageContainer}>
              <Image
                source={{ uri: receipt.imageUrl }}
                style={styles.receiptImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Card>
        )}

        {/* Processing Timeline */}
        <Card style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Processing Timeline</Text>
          
          <View style={styles.timelineItem}>
            <View style={[styles.timelineDot, styles.timelineDotCompleted]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Receipt Submitted</Text>
              <Text style={styles.timelineTime}>{formatDate(receipt.createdAt)}</Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={[
              styles.timelineDot, 
              receipt.status !== 'queued' ? styles.timelineDotCompleted : styles.timelineDotPending
            ]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>OCR Processing</Text>
              <Text style={styles.timelineTime}>
                {receipt.status !== 'queued' ? 'Completed' : 'In progress...'}
              </Text>
            </View>
          </View>

          <View style={styles.timelineItem}>
            <View style={[
              styles.timelineDot, 
              receipt.status === 'approved' || receipt.status === 'rejected' 
                ? styles.timelineDotCompleted 
                : styles.timelineDotPending
            ]} />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineLabel}>Review Complete</Text>
              <Text style={styles.timelineTime}>
                {receipt.status === 'approved' || receipt.status === 'rejected' 
                  ? formatDate(receipt.createdAt) 
                  : 'Pending...'}
              </Text>
            </View>
          </View>
        </Card>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.error,
  },
  statusCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  statusHeader: {
    alignItems: 'center',
  },
  statusDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  detailsCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  detailLabel: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    ...Typography.bodyBold,
    color: Colors.text,
  },
  imageCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  imageTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  imageContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.backgroundSecondary,
  },
  receiptImage: {
    width: '100%',
    height: 400,
  },
  timelineCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  timelineTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  timelineDotCompleted: {
    backgroundColor: Colors.accent,
  },
  timelineDotPending: {
    backgroundColor: Colors.border,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
  },
  timelineTime: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});