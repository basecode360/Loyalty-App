// services/api.ts - COMPLETE UPDATED VERSION
import { supabase } from '../lib/supabase';
import { Receipt, PointsTransaction, Promotion, Notification, Device, ActivityLog } from '../types/api';

// Helper function to get signed URL for receipt image
const getReceiptImageUrl = async (imagePath: string): Promise<string | null> => {
  try {
    if (!imagePath) return null;
    
    const { data, error } = await supabase.storage
      .from('receipts-original')
      .createSignedUrl(imagePath, 3600); // 1 hour expiry
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error in getReceiptImageUrl:', error);
    return null;
  }
};

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

    console.log('🎯 Edge function response:', processData);

    return {
      id: processData.receipt_id,
      retailer: processData.retailer,
      purchaseDate: new Date().toISOString(),
      total: processData.total,
      pointsAwarded: processData.points_awarded,
      ocrConfidence: processData.confidence,
      status: processData.status,
      imageUrl: filename, // Store the path, we'll fetch signed URL when needed
      createdAt: new Date().toISOString(),
      currency: processData.currency || 'USD',
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

    // Process receipts and get signed URLs for images
    const receiptsWithImages = await Promise.all(
      data.map(async (receipt) => {
        const imageUrl = await getReceiptImageUrl(receipt.image_key);
        
        return {
          id: receipt.id,
          retailer: receipt.retailer || 'Unknown Store',
          purchaseDate: receipt.purchase_date || receipt.created_at,
          total: (receipt.total_cents || 0) / 100,
          pointsAwarded: receipt.status === 'approved' ? Math.floor((receipt.total_cents || 0) / 100) : 0,
          ocrConfidence: receipt.confidence || 0,
          status: receipt.status,
          imageUrl: imageUrl,
          imagePath: receipt.image_key,
          createdAt: receipt.created_at,
          currency: receipt.currency || 'USD',
          invoiceNumber: receipt.invoice_number,
          paymentMethod: receipt.payment_method,
        };
      })
    );

    return receiptsWithImages;

  } catch (error: any) {
    console.error('Get receipts error:', error);
    throw new Error(error.message || 'Failed to fetch receipts');
  }
};

// Get single receipt by ID
export const getReceiptById = async (receiptId: string): Promise<Receipt | null> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('id', receiptId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching receipt:', error);
      return null;
    }

    // Get signed URL for image
    const imageUrl = await getReceiptImageUrl(data.image_key);

    return {
      id: data.id,
      retailer: data.retailer || 'Unknown Store',
      purchaseDate: data.purchase_date || data.created_at,
      total: (data.total_cents || 0) / 100,
      pointsAwarded: data.status === 'approved' ? Math.floor((data.total_cents || 0) / 100) : 0,
      ocrConfidence: data.confidence || 0,
      status: data.status,
      imageUrl: imageUrl,
      imagePath: data.image_key,
      createdAt: data.created_at,
      currency: data.currency || 'USD',
      invoiceNumber: data.invoice_number,
      paymentMethod: data.payment_method,
      ocrData: data.ocr_json,
    };

  } catch (error: any) {
    console.error('Get receipt by ID error:', error);
    return null;
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

// Get current points balance
export const getCurrentPointsBalance = async (): Promise<number> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return 0;
    }

    const { data, error } = await supabase
      .from('points_ledger')
      .select('balance_after')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.balance_after || 0;

  } catch (error: any) {
    console.error('Get balance error:', error);
    return 0;
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

    // First try to get from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Get current balance from points ledger
    const balance = await getCurrentPointsBalance();

    if (profileError || !profileData) {
      // If profile doesn't exist, return user data with default values
      return {
        id: user.id,
        email: user.email,
        loyalty_points: balance,
        phone_verified: false,
        status: 'active',
        country: 'USA',
        agree_to_marketing: false
      };
    }
    
    return {
      ...profileData,
      loyalty_points: balance, // Use actual balance from ledger
      country: profileData.country || 'USA'
    };

  } catch (error: any) {
    console.error('Get profile error:', error);
    // Return basic profile even on error
    return {
      id: '',
      email: '',
      loyalty_points: 0,
      phone_verified: false,
      status: 'active',
      country: 'USA'
    };
  }
};

export const updateProfileSettings = async (settings: any): Promise<void> => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Authentication required');
    }

    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      // Update existing profile
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
    } else {
      // Create new profile
      const { error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          ...settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error('Failed to create profile: ' + error.message);
      }
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