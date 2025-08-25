// services/pushNotifications.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  badge?: number;
}

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
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token obtained:', token);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
        
        await Notifications.setNotificationChannelAsync('receipts', {
          name: 'Receipt Updates',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Notifications about receipt processing',
          vibrationPattern: [0, 250, 250, 250],
        });

        await Notifications.setNotificationChannelAsync('promotions', {
          name: 'Promotions',
          importance: Notifications.AndroidImportance.DEFAULT,
          description: 'Special offers and promotions',
        });
      }

      return token;

    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async savePushTokenToDatabase(token: string) {
    try {
      const { supabase } = await import('../lib/supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Save or update device token
      const { error } = await supabase
        .from('devices')
        .upsert({
          user_id: user.id,
          platform: Platform.OS,
          push_token: token,
          last_seen: new Date().toISOString()
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        console.error('Error saving push token:', error);
      } else {
        console.log('Push token saved successfully');
      }
      
    } catch (error) {
      console.error('Error saving push token:', error);
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
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      });
      
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Error scheduling local notification:', error);
    }
  }
}

// Edge Function for sending push notifications
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
    }));

    // Send in chunks of 100
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
