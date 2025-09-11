// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notifications handler (outside component)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useFrameworkReady();

  // Request notification permissions on mount
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }

        console.log('✅ Notification permissions granted');

        // Get push token for remote notifications (optional - for future use)
        if (Platform.OS !== 'web') {
          const token = await Notifications.getExpoPushTokenAsync();
          console.log('Push token:', token.data);
          // You can save this token to your backend for sending push notifications
        }

        // Configure notification channels for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('receipts', {
            name: 'Receipts',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: Colors.primary,
            sound: 'default',
          });

          await Notifications.setNotificationChannelAsync('points', {
            name: 'Points & Rewards',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: Colors.accent,
            sound: 'default',
          });
        }
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Handle notification responses (when user taps on notification)
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);

      // Handle navigation based on notification data
      const data = response.notification.request.content.data;

      if (data?.receiptId) {
        // Navigate to receipt detail
        // You can use router here if needed
        console.log('Navigate to receipt:', data.receiptId);
      } else if (data?.screen) {
        // Navigate to specific screen
        console.log('Navigate to screen:', data.screen);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
        }}
      >
        {/* Auth Screens */}
        <Stack.Screen
          name="(auth)"
          options={{
            animation: 'fade',
          }}
        />

        {/* Main Tab Navigator */}
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: 'fade',
          }}
        />

        {/* Standalone Screens */}
        <Stack.Screen
          name="receipt-detail"
          options={{
            headerShown: true,
            title: 'Receipt Details',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
            animation: 'slide_from_bottom',
          }}
        />

        <Stack.Screen
          name="promotion-detail"
          options={{
            headerShown: true,
            title: 'Promotion Details',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
            animation: 'slide_from_bottom',
          }}
        />

        <Stack.Screen
          name="points-ledger"
          options={{
            headerShown: true,
            title: 'Points History',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="notifications"
          options={{
            headerShown: true,
            title: 'Notifications',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="profile-info"
          options={{
            headerShown: true,
            title: 'Personal Information',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="manage-devices"
          options={{
            headerShown: true,
            title: 'Manage Devices',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="activity-log"
          options={{
            headerShown: true,
            title: 'Activity Log',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />

        <Stack.Screen
          name="app-settings"
          options={{
            headerShown: true,
            title: 'App Settings',
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
            headerShadowVisible: false,
          }}
        />

        {/* 404 Screen */}
        <Stack.Screen
          name="+not-found"
          options={{
            title: 'Not Found',
            headerShown: true,
            headerStyle: {
              backgroundColor: Colors.background,
            },
            headerTintColor: Colors.text,
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}