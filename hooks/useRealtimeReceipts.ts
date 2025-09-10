// hooks/useRealtimeReceipts.ts
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Receipt } from '../types/api';

export const useRealtimeReceipts = () => {
  const { user } = useAuth();
  const [realtimeReceipts, setRealtimeReceipts] = useState<Receipt[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to receipt changes for current user
    const subscription = supabase
      .channel('receipt_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Receipt update received:', payload);
          
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          if (eventType === 'UPDATE' && newRecord) {
            // Update existing receipt in state
            setRealtimeReceipts((prev) =>
              prev.map((receipt) =>
                receipt.id === newRecord.id
                  ? {
                      ...receipt,
                      status: newRecord.status,
                      processed_at: newRecord.processed_at,
                      reject_reason: newRecord.reject_reason,
                      reject_notes: newRecord.reject_notes,
                    }
                  : receipt
              )
            );

            // Show notification based on status change
            if (oldRecord?.status !== newRecord.status) {
              handleStatusNotification(newRecord);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user?.id]);

  const handleStatusNotification = (receipt: any) => {
    // This will be implemented with push notifications
    // For now, we can use local notifications or alerts
    console.log(`Receipt ${receipt.id} status changed to: ${receipt.status}`);
  };

  return { realtimeReceipts };
};
