import { User } from '../types/auth';
import { Receipt, PointsTransaction, Promotion, Notification, Device, ActivityLog } from '../types/api';

// Mock delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Authentication API
export const signInWithEmailOtp = async (email: string): Promise<void> => {
  await delay(2000);
  console.log('Sending OTP to email:', email);
  // TODO: Implement Supabase auth with email OTP
};

export const signInWithPhoneOtp = async (phone: string): Promise<void> => {
  await delay(2000);
  console.log('Sending OTP to phone:', phone);
  // TODO: Implement Supabase auth with SMS OTP
};

export const verifyOtp = async (otp: string): Promise<User> => {
  await delay(1500);
  console.log('Verifying OTP:', otp);
  // TODO: Implement OTP verification with Supabase
  return {
    id: '1',
    email: 'user@example.com',
    phone: '+1234567890',
    name: 'John Doe',
    dateOfBirth: '1990-01-01',
    pointsBalance: 2450,
  };
};

export const signOut = async (): Promise<void> => {
  await delay(1000);
  console.log('Signing out user');
  // TODO: Implement Supabase sign out
};

// Receipts API
export const submitReceipt = async (imageUri: string): Promise<Receipt> => {
  await delay(3000);
  console.log('Submitting receipt:', imageUri);
  // TODO: Implement receipt submission to Supabase with OCR processing
  return {
    id: Date.now().toString(),
    retailer: 'Target',
    purchaseDate: new Date().toISOString(),
    total: 45.67,
    pointsAwarded: 0,
    ocrConfidence: 0.95,
    status: 'processing',
    imageUrl: imageUri,
    createdAt: new Date().toISOString(),
  };
};

export const getReceipts = async (): Promise<Receipt[]> => {
  await delay(1000);
  console.log('Fetching receipts');
  // TODO: Implement Supabase query to get user receipts
  return [
    {
      id: '1',
      retailer: 'Walmart',
      purchaseDate: '2024-01-15T10:30:00Z',
      total: 89.45,
      pointsAwarded: 89,
      ocrConfidence: 0.98,
      status: 'approved',
      createdAt: '2024-01-15T10:35:00Z',
    },
    {
      id: '2',
      retailer: 'Target',
      purchaseDate: '2024-01-14T15:20:00Z',
      total: 156.78,
      pointsAwarded: 156,
      ocrConfidence: 0.92,
      status: 'approved',
      createdAt: '2024-01-14T15:25:00Z',
    },
  ];
};

// Points API
export const getPointsLedger = async (): Promise<PointsTransaction[]> => {
  await delay(1000);
  console.log('Fetching points ledger');
  // TODO: Implement Supabase query to get points transactions
  return [
    {
      id: '1',
      type: 'earned',
      amount: 89,
      reason: 'Receipt approved - Walmart',
      balanceAfter: 2450,
      createdAt: '2024-01-15T10:35:00Z',
      receiptId: '1',
    },
    {
      id: '2',
      type: 'earned',
      amount: 156,
      reason: 'Receipt approved - Target',
      balanceAfter: 2361,
      createdAt: '2024-01-14T15:25:00Z',
      receiptId: '2',
    },
  ];
};

// Promotions API
export const getPromotions = async (): Promise<Promotion[]> => {
  await delay(1000);
  console.log('Fetching promotions');
  // TODO: Implement Supabase query to get active promotions
  return [
    {
      id: '1',
      title: 'Double Points Weekend',
      description: 'Earn 2x points on all grocery purchases this weekend!',
      imageUrl: 'https://images.pexels.com/photos/264547/pexels-photo-264547.jpeg',
      startDate: '2024-01-20T00:00:00Z',
      endDate: '2024-01-22T23:59:59Z',
      isActive: true,
      pointsMultiplier: 2,
    },
    {
      id: '2',
      title: 'Bonus Points - Electronics',
      description: 'Get extra 50 points on electronics purchases over $100',
      imageUrl: 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-31T23:59:59Z',
      isActive: true,
      minimumSpend: 100,
    },
  ];
};

// Notifications API
export const getNotifications = async (): Promise<Notification[]> => {
  await delay(1000);
  console.log('Fetching notifications');
  // TODO: Implement Supabase query to get user notifications
  return [
    {
      id: '1',
      type: 'transactional',
      title: 'Receipt Approved',
      message: 'Your Walmart receipt has been approved. 89 points added to your account.',
      isRead: false,
      createdAt: '2024-01-15T10:35:00Z',
    },
    {
      id: '2',
      type: 'marketing',
      title: 'Double Points Weekend',
      message: 'This weekend only - earn 2x points on all purchases!',
      isRead: true,
      createdAt: '2024-01-13T09:00:00Z',
    },
  ];
};

// Profile API
export const getProfile = async (): Promise<User> => {
  await delay(1000);
  console.log('Fetching profile');
  // TODO: Implement Supabase query to get user profile
  return {
    id: '1',
    email: 'user@example.com',
    phone: '+1234567890',
    name: 'John Doe',
    dateOfBirth: '1990-01-01',
    pointsBalance: 2450,
  };
};

export const updateProfileSettings = async (settings: any): Promise<void> => {
  await delay(1500);
  console.log('Updating profile settings:', settings);
  // TODO: Implement Supabase profile settings update
};

// Device Management API
export const getDevices = async (): Promise<Device[]> => {
  await delay(1000);
  console.log('Fetching devices');
  // TODO: Implement Supabase query to get user devices
  return [
    {
      id: '1',
      platform: 'ios',
      pushToken: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
      isActive: true,
      lastUsed: '2024-01-15T10:35:00Z',
    },
    {
      id: '2',
      platform: 'android',
      pushToken: 'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy',
      isActive: false,
      lastUsed: '2024-01-10T14:20:00Z',
    },
  ];
};

// Activity Log API
export const getActivityLog = async (): Promise<ActivityLog[]> => {
  await delay(1000);
  console.log('Fetching activity log');
  // TODO: Implement Supabase query to get user activity log
  return [
    {
      id: '1',
      action: 'Receipt Submitted',
      details: 'Walmart receipt - $89.45',
      timestamp: '2024-01-15T10:30:00Z',
      ipAddress: '192.168.1.1',
    },
    {
      id: '2',
      action: 'Profile Updated',
      details: 'Changed notification preferences',
      timestamp: '2024-01-14T16:45:00Z',
      ipAddress: '192.168.1.1',
    },
  ];
};