import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider } from '../contexts/AuthContext';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
        <Stack.Screen 
          name="receipt-detail" 
          options={{ 
            headerShown: true,
            title: 'Receipt Details',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="promotion-detail" 
          options={{ 
            headerShown: true,
            title: 'Promotion Details',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="points-ledger" 
          options={{ 
            headerShown: true,
            title: 'Points History',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="notifications" 
          options={{ 
            headerShown: true,
            title: 'Notifications',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="profile-info" 
          options={{ 
            headerShown: true,
            title: 'Personal Information',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="manage-devices" 
          options={{ 
            headerShown: true,
            title: 'Manage Devices',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="activity-log" 
          options={{ 
            headerShown: true,
            title: 'Activity Log',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
        <Stack.Screen 
          name="app-settings" 
          options={{ 
            headerShown: true,
            title: 'App Settings',
            headerStyle: { backgroundColor: Colors.background },
            headerTintColor: Colors.text,
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </AuthProvider>
  );
}