// types/api.ts
export interface Receipt {
  id: string;
  retailer: string;
  purchaseDate: string;
  total: number;
  pointsAwarded: number;
  ocrConfidence: number;
  status: 'processing' | 'queued' | 'approved' | 'rejected' | 'duplicate';
  imageUrl?: string;
  createdAt: string;
}

export interface PointsTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjustment';
  amount: number;
  reason: string;
  balanceAfter: number;
  createdAt: string;
  receiptId?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  pointsMultiplier?: number;
  minimumSpend?: number;
}

export interface Notification {
  id: string;
  type: 'transactional' | 'marketing';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Device {
  id: string;
  platform: 'ios' | 'android' | 'web';
  pushToken: string;
  isActive: boolean;
  lastUsed: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}