import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Tag, Calendar, Star } from 'lucide-react-native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';
import { Promotion } from '../../types/api';
import * as api from '../../services/api';

export default function PromotionsScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      const data = await api.getPromotions();
      setPromotions(data);
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPromotions();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderPromotionItem = ({ item }: { item: Promotion }) => {
    const daysRemaining = getDaysRemaining(item.endDate);
    const isExpiringSoon = daysRemaining <= 3;

    return (
      <TouchableOpacity
        onPress={() => router.push({
          pathname: '/promotion-detail',
          params: { promotionId: item.id }
        })}
      >
        <Card style={styles.promotionCard}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.promotionImage}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Badge
                text={daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                variant={isExpiringSoon ? 'warning' : 'success'}
              />
            </View>
          </View>

          <View style={styles.promotionContent}>
            <Text style={styles.promotionTitle}>{item.title}</Text>
            <Text style={styles.promotionDescription} numberOfLines={2}>
              {item.description}
            </Text>

            <View style={styles.promotionDetails}>
              <View style={styles.detailRow}>
                <Calendar size={16} color={Colors.textSecondary} />
                <Text style={styles.detailText}>
                  {formatDate(item.startDate)} - {formatDate(item.endDate)}
                </Text>
              </View>

              {item.pointsMultiplier && (
                <View style={styles.detailRow}>
                  <Star size={16} color={Colors.accent} />
                  <Text style={[styles.detailText, { color: Colors.accent }]}>
                    {item.pointsMultiplier}x Points
                  </Text>
                </View>
              )}

              {item.minimumSpend && (
                <View style={styles.detailRow}>
                  <Text style={styles.minimumSpend}>
                    Min. spend: ${item.minimumSpend}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Tag size={64} color={Colors.textLight} />
      <Text style={styles.emptyTitle}>No Promotions Available</Text>
      <Text style={styles.emptyDescription}>
        Check back later for exciting offers and bonus point opportunities
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Promotions</Text>
        <Text style={styles.subtitle}>
          {promotions.filter(p => p.isActive).length} active promotion{promotions.filter(p => p.isActive).length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={promotions.filter(p => p.isActive)}
        renderItem={renderPromotionItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
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
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  listContent: {
    padding: Spacing.lg,
    flexGrow: 1,
  },
  promotionCard: {
    marginBottom: Spacing.lg,
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
  },
  promotionImage: {
    width: '100%',
    height: 150,
  },
  imageOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  promotionContent: {
    padding: Spacing.md,
  },
  promotionTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  promotionDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  promotionDetails: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  detailText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  minimumSpend: {
    ...Typography.caption,
    color: Colors.textLight,
    fontStyle: 'italic',
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