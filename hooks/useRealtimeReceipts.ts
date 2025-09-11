// hooks/useRealtimeReceipts.ts
import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';

export const useRealtimeReceipts = () => {
  const { user, refreshProfile } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up realtime subscription for user:', user.id);

    // Subscribe to receipt changes
    const receiptChannel = supabase
      .channel(`user-receipts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Receipt realtime event:', payload.eventType);

          const { eventType, new: newRecord, old: oldRecord } = payload;

          // Handle different events
          switch (eventType) {
            case 'INSERT':
              handleNewReceipt(newRecord);
              break;

            case 'UPDATE':
              await handleReceiptUpdate(newRecord, oldRecord);
              break;

            case 'DELETE':
              handleReceiptDelete(oldRecord);
              break;
          }
        }
      )
      .subscribe();

    // Subscribe to points ledger changes
    const pointsChannel = supabase
      .channel(`user-points-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'points_ledger',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Points update received:', payload.new);

          // Refresh user profile to update points balance
          if (refreshProfile) {
            await refreshProfile();
          }

          // Show notification
          const pointsAwarded = payload.new.delta;
          if (pointsAwarded > 0) {
            showNotification(
              '🎉 Points Earned!',
              `You earned ${pointsAwarded} points!`
            );
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      console.log('Cleaning up realtime subscriptions');
      supabase.removeChannel(receiptChannel);
      supabase.removeChannel(pointsChannel);
    };
  }, [user?.id, refreshProfile]);

  const handleNewReceipt = useCallback((receipt: any) => {
    console.log('New receipt submitted:', receipt.id);

    // Show notification based on status
    if (receipt.status === 'approved') {
      showNotification(
        '✅ Receipt Approved!',
        'Your receipt was automatically approved.'
      );
    } else if (receipt.status === 'queued') {
      showNotification(
        '⏳ Receipt Submitted',
        'Your receipt is being reviewed. You\'ll be notified once processed.'
      );
    } else if (receipt.status === 'duplicate') {
      showNotification(
        '⚠️ Duplicate Receipt',
        'This receipt appears to be a duplicate.'
      );
    }
  }, []);

  const handleReceiptUpdate = useCallback(async (newRecord: any, oldRecord: any) => {
    console.log('Receipt updated:', {
      id: newRecord.id,
      oldStatus: oldRecord?.status,
      newStatus: newRecord.status
    });

    // Only show notification if status changed
    if (oldRecord?.status === newRecord.status) return;

    // Status change notifications
    switch (newRecord.status) {
      case 'approved':
        // Calculate points (same as backend)
        const pointsAwarded = Math.floor((newRecord.total_cents || 0) / 100);

        showNotification(
          '✅ Receipt Approved!',
          `Your receipt from ${newRecord.retailer || 'the store'} was approved. +${pointsAwarded} points!`
        );

        // Refresh profile to get updated points
        if (refreshProfile) {
          await refreshProfile();
        }
        break;

      case 'rejected':
        const reason = newRecord.reject_reason
          ?.replace(/_/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
          || 'Review failed';

        showNotification(
          '❌ Receipt Rejected',
          `Reason: ${reason}${newRecord.reject_notes ? '\nNote: ' + newRecord.reject_notes : ''}`
        );
        break;

      case 'queued':
        showNotification(
          '🔍 Manual Review Required',
          'Your receipt needs manual review. We\'ll notify you once completed.'
        );
        break;
    }
  }, [refreshProfile]);

  const handleReceiptDelete = useCallback((receipt: any) => {
    console.log('Receipt deleted:', receipt.id);

    showNotification(
      '🗑️ Receipt Removed',
      'A receipt was removed from your account.'
    );
  }, []);

  const showNotification = async (title: string, body: string) => {
    // Try push notification first
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.log('Push notification failed, using Alert');
      // Fallback to Alert
      Alert.alert(title, body);
    }
  };

  // No need to return realtimeReceipts as they're handled in the main receipts state
  return {};
};
