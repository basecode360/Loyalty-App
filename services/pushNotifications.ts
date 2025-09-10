// services/pushNotifications.ts - UPDATED WITH MISSING FEATURES
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { supabase } from '../lib/supabase';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
  categoryIdentifier?: string;
}

// Configure notification handling
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Handle different notification types
    const data = notification.request.content.data;
    
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: data?.priority === 'high' ? Notifications.AndroidNotificationPriority.HIGH : Notifications.AndroidNotificationPriority.DEFAULT,
    };
  },
});

export class PushNotificationService {
  
  static async registerForPushNotifications(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Must use physical device for Push Notifications');
        return null;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID, // Add your Expo project ID
      });
      const token = tokenData.data;
      
      console.log('Push token obtained:', token);

      // Configure notification channels for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Configure notification categories (for action buttons)
      await this.setupNotificationCategories();

      return token;

    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async setupAndroidChannels() {
    // Default channel
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });
    
    // Receipt updates channel
    await Notifications.setNotificationChannelAsync('receipts', {
      name: 'Receipt Updates',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notifications about receipt processing status',
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
      enableLights: true,
      lightColor: '#00FF00',
    });

    // Promotions channel
    await Notifications.setNotificationChannelAsync('promotions', {
      name: 'Promotions & Offers',
      importance: Notifications.AndroidImportance.DEFAULT,
      description: 'Special offers and promotional notifications',
      sound: 'default',
    });

    // Points earned channel
    await Notifications.setNotificationChannelAsync('points', {
      name: 'Points Earned',
      importance: Notifications.AndroidImportance.HIGH,
      description: 'Notifications when you earn points',
      vibrationPattern: [0, 150, 150, 150],
      sound: 'default',
    });
  }

  static async setupNotificationCategories() {
    // Receipt action category
    await Notifications.setNotificationCategoryAsync('receipt_action', [
      {
        identifier: 'view_receipt',
        buttonTitle: 'View Receipt',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'view_points',
        buttonTitle: 'View Points',
        options: {
          opensAppToForeground: true,
        },
      },
    ]);

    // Promotion action category
    await Notifications.setNotificationCategoryAsync('promotion_action', [
      {
        identifier: 'view_promotion',
        buttonTitle: 'View Offer',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }

  static async savePushTokenToDatabase(token: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found, cannot save push token');
        return;
      }

      // Check if device already exists
      const { data: existingDevice } = await supabase
        .from('devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('platform', Platform.OS)
        .single();

      const deviceData = {
        user_id: user.id,
        platform: Platform.OS,
        push_token: token,
        device_info: {
          model: Device.modelName,
          brand: Device.brand,
          os_version: Device.osVersion,
          device_name: Device.deviceName,
        },
        last_seen: new Date().toISOString(),
      };

      if (existingDevice) {
        // Update existing device
        const { error } = await supabase
          .from('devices')
          .update(deviceData)
          .eq('id', existingDevice.id);

        if (error) {
          console.error('Error updating device:', error);
        } else {
          console.log('Device updated successfully');
        }
      } else {
        // Insert new device
        const { error } = await supabase
          .from('devices')
          .insert(deviceData);

        if (error) {
          console.error('Error saving device:', error);
        } else {
          console.log('Device saved successfully');
        }
      }
      
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  static async setupNotificationListeners() {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received while app running:', notification);
      
      // You can show custom in-app notifications here
      const data = notification.request.content.data;
      
      // Handle different notification types
      if (data?.type === 'receipt_approved') {
        // Show success banner
        console.log('Receipt approved notification received');
      } else if (data?.type === 'receipt_rejected') {
        // Show rejection notification
        console.log('Receipt rejected notification received');
      }
    });

    // Handle notification tapped (app opened from notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      const actionIdentifier = response.actionIdentifier;
      
      // Handle different actions
      if (actionIdentifier === 'view_receipt') {
        // Navigate to receipt details
        this.handleNavigateToReceipt(data?.receiptId);
      } else if (actionIdentifier === 'view_points') {
        // Navigate to points ledger
        this.handleNavigateToPoints();
      } else if (actionIdentifier === 'view_promotion') {
        // Navigate to promotions
        this.handleNavigateToPromotions(data?.promotionId);
      } else {
        // Default tap action
        this.handleDefaultNavigation(data);
      }
    });
  }

  static handleNavigateToReceipt(receiptId?: string) {
    // This will be handled by your navigation system
    console.log('Navigate to receipt:', receiptId);
    // Example: router.push(`/receipt-detail?id=${receiptId}`);
  }

  static handleNavigateToPoints() {
    console.log('Navigate to points ledger');
    // Example: router.push('/points-ledger');
  }

  static handleNavigateToPromotions(promotionId?: string) {
    console.log('Navigate to promotions:', promotionId);
    // Example: router.push(`/promotions?id=${promotionId}`);
  }

  static handleDefaultNavigation(data: any) {
    console.log('Default navigation with data:', data);
    
    // Navigate based on notification type
    switch (data?.type) {
      case 'receipt_approved':
      case 'receipt_rejected':
        this.handleNavigateToReceipt(data?.receiptId);
        break;
      case 'points_earned':
        this.handleNavigateToPoints();
        break;
      case 'promotion':
        this.handleNavigateToPromotions(data?.promotionId);
        break;
      default:
        // Navigate to home
        console.log('Navigate to home');
        break;
    }
  }

  static async sendPushNotification(
    expoPushToken: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      const message = {
        to: expoPushToken,
        sound: notification.sound !== false ? 'default' : null,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        categoryId: notification.categoryIdentifier,
        channelId: this.getChannelId(notification.data?.type),
      };

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();
      
      if (result.data?.status === 'ok') {
        console.log('Push notification sent successfully');
        return true;
      } else {
        console.error('Push notification error:', result);
        return false;
      }
      
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  static getChannelId(notificationType?: string): string {
    switch (notificationType) {
      case 'receipt_approved':
      case 'receipt_rejected':
      case 'receipt_processed':
        return 'receipts';
      case 'points_earned':
        return 'points';
      case 'promotion':
      case 'special_offer':
        return 'promotions';
      default:
        return 'default';
    }
  }

  static async scheduleLocalNotification(
    notification: PushNotificationData,
    delaySeconds: number = 0
  ) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound !== false,
          badge: notification.badge,
          categoryIdentifier: notification.categoryIdentifier,
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      });
      
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }

  // Helper method to show receipt status notification
  static async showReceiptStatusNotification(
    status: 'approved' | 'rejected',
    receiptId: string,
    pointsEarned?: number
  ) {
    const title = status === 'approved' ? '✅ Receipt Approved!' : '❌ Receipt Rejected';
    const body = status === 'approved' 
      ? `Great! You earned ${pointsEarned || 0} points.`
      : 'Your receipt could not be processed. Please try again.';

    await this.scheduleLocalNotification({
      title,
      body,
      data: {
        type: `receipt_${status}`,
        receiptId,
        pointsEarned,
      },
      categoryIdentifier: 'receipt_action',
    });
  }

  // Helper method to show points earned notification
  static async showPointsEarnedNotification(points: number, receiptId: string) {
    await this.scheduleLocalNotification({
      title: '🏆 Points Earned!',
      body: `You earned ${points} points from your recent receipt.`,
      data: {
        type: 'points_earned',
        points,
        receiptId,
      },
      categoryIdentifier: 'receipt_action',
    });
  }

  // Helper method to show promotion notification
  static async showPromotionNotification(
    title: string,
    message: string,
    promotionId: string
  ) {
    await this.scheduleLocalNotification({
      title: `🎉 ${title}`,
      body: message,
      data: {
        type: 'promotion',
        promotionId,
      },
      categoryIdentifier: 'promotion_action',
    });
  }

  // Get current notification settings
  static async getNotificationSettings() {
    try {
      const settings = await Notifications.getPermissionsAsync();
      return {
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
        ios: settings.ios,
        android: settings.android,
      };
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }

  // Update badge count
  static async setBadgeCount(count: number) {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  // Clear all notifications
  static async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      await this.setBadgeCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }
}

// Edge Function for sending push notifications via Supabase
export const sendBulkPushNotifications = async (
  tokens: string[],
  notification: PushNotificationData
): Promise<void> => {
  try {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: notification.data || {},
      channelId: PushNotificationService.getChannelId(notification.data?.type),
    }));

    // Send in chunks of 100 (Expo limit)
    const chunks = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }

    for (const chunk of chunks) {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(chunk),
      });

      const result = await response.json();
      console.log('Bulk push result:', result);
    }
    
  } catch (error) {
    console.error('Error sending bulk push notifications:', error);
  }
};

// Initialize push notifications - call this in your App.tsx
export const initializePushNotifications = async () => {
  try {
    const token = await PushNotificationService.registerForPushNotifications();
    
    if (token) {
      await PushNotificationService.savePushTokenToDatabase(token);
      await PushNotificationService.setupNotificationListeners();
    }
    
    return token;
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return null;
  }
};
