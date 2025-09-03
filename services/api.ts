// services/api.ts
import { supabase } from '../lib/supabase';
import { Receipt, PointsTransaction, Promotion, Notification, Device, ActivityLog } from '../types/api';

// Receipts API
export const submitReceipt = async (imageUri: string): Promise<Receipt> => {
  try {
    console.log('📸 Starting receipt submission...');

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Please login first');
    }

    // Try signed URL approach for large files
    const filename = `${user.id}/receipt_${Date.now()}.jpg`;

    console.log('Creating signed URL...');

    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from('receipts-original')
      .createSignedUploadUrl(filename);

    if (signedError) {
      throw new Error('Could not create upload URL: ' + signedError.message);
    }

    console.log('Uploading via signed URL...');

    // Upload using signed URL
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(signedUrlData.signedUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': 'image/jpeg',
      }
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed with status: ' + uploadResponse.status);
    }

    console.log('✅ Image uploaded successfully');

    // Now call edge function
    const { data: { session } } = await supabase.auth.getSession();

    const { data: processData, error: processError } = await supabase.functions
      .invoke('submit-receipt', {
        body: {
          image_path: filename
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

    if (processError) {
      throw new Error('Processing failed: ' + processError.message);
    }

    return {
      id: processData.receipt_id || Date.now().toString(),
      retailer: processData.retailer || 'Test Store',
      purchaseDate: new Date().toISOString(),
      total: processData.total || 100,
      pointsAwarded: processData.points_awarded || 10,
      ocrConfidence: 0.9,
      status: processData.status || 'approved',
      imageUrl: imageUri,
      createdAt: new Date().toISOString(),
    };

  } catch (error: any) {
    console.error('❌ Error:', error);
    throw new Error(error.message || 'Failed to submit receipt');
  }
};

export const getReceipts = async (): Promise<Receipt[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch receipts: ' + error.message);
    }

    return data.map(receipt => ({
      id: receipt.id,
      retailer: receipt.retailer || 'Unknown',
      purchaseDate: receipt.purchase_date || receipt.created_at,
      total: (receipt.total_cents || 0) / 100,
      pointsAwarded: receipt.status === 'approved' ? Math.floor((receipt.total_cents || 0) / 100) : 0,
      ocrConfidence: receipt.confidence || 0,
      status: receipt.status,
      createdAt: receipt.created_at,
    }));

  } catch (error: any) {
    console.error('Get receipts error:', error);
    throw new Error(error.message || 'Failed to fetch receipts');
  }
};

// Points API
export const getPointsLedger = async (): Promise<PointsTransaction[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('points_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch points ledger: ' + error.message);
    }

    return data.map(transaction => ({
      id: transaction.id,
      type: transaction.delta > 0 ? 'earned' : 'redeemed',
      amount: Math.abs(transaction.delta),
      reason: transaction.reason,
      balanceAfter: transaction.balance_after,
      createdAt: transaction.created_at,
      receiptId: transaction.receipt_id,
      receipt_id: transaction.receipt_id,
      promotion_id: transaction.promo_id,
    }));

  } catch (error: any) {
    console.error('Get points ledger error:', error);
    throw new Error(error.message || 'Failed to fetch points ledger');
  }
};

// Promotions API
export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('status', 'active')
      .order('start_at', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch promotions: ' + error.message);
    }

    return data.map(promo => ({
      id: promo.id,
      title: promo.name || 'Special Promotion',
      description: promo.rule_json?.description || 'Limited time offer',
      imageUrl: promo.rule_json?.image_url || 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg',
      startDate: promo.start_at,
      endDate: promo.end_at,
      isActive: promo.status === 'active',
      pointsMultiplier: promo.rule_json?.points_multiplier,
      minimumSpend: promo.rule_json?.minimum_spend,
    }));

  } catch (error: any) {
    console.error('Get promotions error:', error);
    // Return empty array for promotions if error
    return [];
  }
};

// Profile API
export const getProfile = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error('Failed to fetch profile: ' + error.message);
    }

    return data;

  } catch (error: any) {
    console.error('Get profile error:', error);
    throw new Error(error.message || 'Failed to fetch profile');
  }
};

export const updateProfileSettings = async (settings: any): Promise<void> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      throw new Error('Failed to update profile: ' + error.message);
    }

    console.log('Profile updated successfully');

  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};

// Device Management API
export const getDevices = async (): Promise<Device[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_seen', { ascending: false });

    if (error) {
      throw new Error('Failed to fetch devices: ' + error.message);
    }

    return data.map(device => ({
      id: device.id,
      platform: device.platform,
      pushToken: device.push_token || '',
      isActive: device.last_seen ?
        (new Date().getTime() - new Date(device.last_seen).getTime()) < 7 * 24 * 60 * 60 * 1000 : false,
      lastUsed: device.last_seen || device.created_at,
    }));

  } catch (error: any) {
    console.error('Get devices error:', error);
    return [];
  }
};

// Activity Log API  
export const getActivityLog = async (): Promise<ActivityLog[]> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .eq('actor', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      throw new Error('Failed to fetch activity log: ' + error.message);
    }

    return data.map(log => ({
      id: log.id,
      action: log.action || 'Unknown Action',
      details: log.target || '',
      timestamp: log.created_at,
      ipAddress: log.diff?.ip_address,
    }));

  } catch (error: any) {
    console.error('Get activity log error:', error);
    return [];
  }
};

// Notifications API (if you have a notifications table)
export const getNotifications = async (): Promise<Notification[]> => {
  // For now return empty - you can implement this later
  return [];
};