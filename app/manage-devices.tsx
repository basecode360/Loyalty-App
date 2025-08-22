import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  ArrowLeft,
  Smartphone,
  Monitor,
  Tablet,
  Wifi,
  WifiOff,
  MoreVertical,
  Shield,
  AlertTriangle
} from 'lucide-react-native';
import * as Device from 'expo-device';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../constants/Colors';

interface DeviceInfo {
  id: string;
  name: string;
  type: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  platform: string;
  lastActive: string;
  isCurrentDevice: boolean;
  location: string;
  status: 'active' | 'inactive';
}

export default function ManageDevicesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDeviceInfo, setCurrentDeviceInfo] = useState<any>(null);

  useEffect(() => {
    loadDevices();
    getCurrentDeviceInfo();
  }, []);

  const getCurrentDeviceInfo = async () => {
    try {
      const deviceInfo = {
        name: Device.deviceName || 'Unknown Device',
        type: Device.deviceType,
        platform: Platform.OS,
        modelName: Device.modelName,
        osVersion: Device.osVersion,
        brand: Device.brand,
      };
      setCurrentDeviceInfo(deviceInfo);
    } catch (error) {
      console.error('Error getting device info:', error);
    }
  };

  const loadDevices = async () => {
    try {
      // Mock device data - in production, fetch from your backend
      const mockDevices: DeviceInfo[] = [
        {
          id: '1',
          name: Device.deviceName || 'Current Device',
          type: 'mobile',
          platform: `${Platform.OS} ${Device.osVersion}`,
          lastActive: new Date().toISOString(),
          isCurrentDevice: true,
          location: 'Karachi, Pakistan',
          status: 'active',
        },
        {
          id: '2',
          name: 'iPhone 13',
          type: 'mobile',
          platform: 'iOS 16.4',
          lastActive: new Date(Date.now() - 86400000).toISOString(),
          isCurrentDevice: false,
          location: 'Lahore, Pakistan',
          status: 'inactive',
        },
        {
          id: '3',
          name: 'MacBook Pro',
          type: 'desktop',
          platform: 'macOS 13.3',
          lastActive: new Date(Date.now() - 172800000).toISOString(),
          isCurrentDevice: false,
          location: 'Karachi, Pakistan',
          status: 'inactive',
        },
      ];

      setDevices(mockDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDeviceIcon = (type: DeviceInfo['type']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone size={24} color={Colors.primary} />;
      case 'tablet':
        return <Tablet size={24} color={Colors.primary} />;
      case 'desktop':
        return <Monitor size={24} color={Colors.primary} />;
      default:
        return <Smartphone size={24} color={Colors.primary} />;
    }
  };

  const formatLastActive = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleDeviceAction = (device: DeviceInfo) => {
    if (device.isCurrentDevice) {
      Alert.alert('Current Device', 'You cannot remove the device you are currently using.');
      return;
    }

    Alert.alert(
      'Device Actions',
      `Choose an action for ${device.name}`,
      [
        {
          text: 'Sign Out',
          onPress: () => handleSignOutDevice(device),
          style: 'destructive',
        },
        {
          text: 'View Details',
          onPress: () => handleViewDetails(device),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleSignOutDevice = (device: DeviceInfo) => {
    Alert.alert(
      'Sign Out Device',
      `Are you sure you want to sign out ${device.name}? This will end all active sessions on that device.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement device sign out API call
              console.log('Signing out device:', device.id);
              
              // Update device status
              setDevices(prev => prev.filter(d => d.id !== device.id));
              
              Alert.alert('Success', `${device.name} has been signed out successfully.`);
            } catch (error) {
              console.error('Error signing out device:', error);
              Alert.alert('Error', 'Failed to sign out device. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleViewDetails = (device: DeviceInfo) => {
    Alert.alert(
      'Device Details',
      `Name: ${device.name}\n` +
      `Platform: ${device.platform}\n` +
      `Location: ${device.location}\n` +
      `Last Active: ${formatLastActive(device.lastActive)}\n` +
      `Status: ${device.status}`,
      [{ text: 'OK' }]
    );
  };

  const handleSignOutAll = () => {
    const otherDevices = devices.filter(d => !d.isCurrentDevice);
    
    if (otherDevices.length === 0) {
      Alert.alert('No Other Devices', 'You are only signed in on this device.');
      return;
    }

    Alert.alert(
      'Sign Out All Devices',
      `This will sign out all other devices (${otherDevices.length} devices). You will remain signed in on this device.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out All',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement sign out all API call
              setDevices(prev => prev.filter(d => d.isCurrentDevice));
              Alert.alert('Success', 'All other devices have been signed out successfully.');
            } catch (error) {
              console.error('Error signing out all devices:', error);
              Alert.alert('Error', 'Failed to sign out devices. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderDeviceItem = (device: DeviceInfo) => (
    <Card key={device.id} style={styles.deviceCard}>
      <View style={styles.deviceHeader}>
        <View style={styles.deviceInfo}>
          <View style={styles.deviceIconContainer}>
            {getDeviceIcon(device.type)}
            {device.status === 'active' ? (
              <Wifi size={12} color={Colors.accent} style={styles.statusIcon} />
            ) : (
              <WifiOff size={12} color={Colors.textLight} style={styles.statusIcon} />
            )}
          </View>
          <View style={styles.deviceDetails}>
            <View style={styles.deviceNameRow}>
              <Text style={styles.deviceName}>{device.name}</Text>
              {device.isCurrentDevice && (
                <Badge text="This device" variant="primary" />
              )}
            </View>
            <Text style={styles.devicePlatform}>{device.platform}</Text>
            <Text style={styles.deviceLocation}>📍 {device.location}</Text>
            <Text style={styles.deviceLastActive}>
              Last active: {formatLastActive(device.lastActive)}
            </Text>
          </View>
        </View>
        {!device.isCurrentDevice && (
          <TouchableOpacity
            style={styles.deviceAction}
            onPress={() => handleDeviceAction(device)}
          >
            <MoreVertical size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Devices</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Security Info */}
        <Card style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={24} color={Colors.accent} />
            <Text style={styles.securityTitle}>Device Security</Text>
          </View>
          <Text style={styles.securityDescription}>
            You're signed in to {devices.length} device{devices.length !== 1 ? 's' : ''}. 
            For your security, sign out of devices you don't recognize or no longer use.
          </Text>
        </Card>

        {/* Current Device Info */}
        {currentDeviceInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Device Information</Text>
            <Card>
              <View style={styles.currentDeviceInfo}>
                <Text style={styles.infoLabel}>Device Name:</Text>
                <Text style={styles.infoValue}>{currentDeviceInfo.name}</Text>
              </View>
              <View style={styles.currentDeviceInfo}>
                <Text style={styles.infoLabel}>Platform:</Text>
                <Text style={styles.infoValue}>
                  {currentDeviceInfo.platform} {currentDeviceInfo.osVersion}
                </Text>
              </View>
              <View style={styles.currentDeviceInfo}>
                <Text style={styles.infoLabel}>Model:</Text>
                <Text style={styles.infoValue}>
                  {currentDeviceInfo.brand} {currentDeviceInfo.modelName}
                </Text>
              </View>
            </Card>
          </View>
        )}

        {/* All Devices */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Devices ({devices.length})</Text>
            {devices.filter(d => !d.isCurrentDevice).length > 0 && (
              <TouchableOpacity onPress={handleSignOutAll}>
                <Text style={styles.signOutAllText}>Sign out all</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {devices.map(renderDeviceItem)}
        </View>

        {/* Security Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Tips</Text>
          <Card>
            <View style={styles.tipItem}>
              <AlertTriangle size={16} color={Colors.warning} />
              <Text style={styles.tipText}>
                Always sign out of shared or public devices
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Shield size={16} color={Colors.accent} />
              <Text style={styles.tipText}>
                Review your device list regularly for suspicious activity
              </Text>
            </View>
            <View style={styles.tipItem}>
              <Smartphone size={16} color={Colors.primary} />
              <Text style={styles.tipText}>
                Enable device lock screens for added security
              </Text>
            </View>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  securityCard: {
    margin: Spacing.lg,
    backgroundColor: `${Colors.accent}10`,
    borderWidth: 1,
    borderColor: `${Colors.accent}30`,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  securityTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  securityDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
  },
  signOutAllText: {
    ...Typography.body,
    color: Colors.error,
    fontWeight: '600',
  },
  deviceCard: {
    marginBottom: Spacing.md,
  },
  deviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  deviceInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  deviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    position: 'relative',
  },
  statusIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 2,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  deviceName: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginRight: Spacing.sm,
  },
  devicePlatform: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  deviceLocation: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  deviceLastActive: {
    ...Typography.small,
    color: Colors.textLight,
  },
  deviceAction: {
    padding: Spacing.sm,
  },
  currentDeviceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoLabel: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...Typography.body,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
});