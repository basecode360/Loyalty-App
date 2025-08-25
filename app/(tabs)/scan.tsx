import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, X, Check, RotateCcw, FlipHorizontal } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing } from '../../constants/Colors';
import * as api from '../../services/api';

export default function ScanScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <LoadingSpinner size={32} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <View style={styles.permissionIconContainer}>
            <Camera size={64} color={Colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan receipts and earn points
          </Text>
          <Button
            title="Grant Permission"
            onPress={requestPermission}
            style={styles.permissionButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        
        if (photo?.uri) {
          setCapturedImage(photo.uri);
          setShowConfirmation(true);
        }
      } catch (error) {
        console.error('Error taking picture:', error);
        Alert.alert('Error', 'Failed to capture image. Please try again.');
      }
    }
  };

  const handleUploadReceipt = async () => {
    if (!capturedImage) return;

    setIsUploading(true);
    try {
      const receipt = await api.submitReceipt(capturedImage);
      
      // Show success message
      Alert.alert(
        'Receipt Submitted!',
        'Your receipt has been submitted for processing. You\'ll receive points once it\'s approved.',
        [
          {
            text: 'View Receipts',
            onPress: () => router.push('/(tabs)/receipts'),
          },
          {
            text: 'Scan Another',
            onPress: () => {
              setShowConfirmation(false);
              setCapturedImage(null);
            },
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error uploading receipt:', error);
      Alert.alert('Error', 'Failed to upload receipt. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const retakePhoto = () => {
    setShowConfirmation(false);
    setCapturedImage(null);
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan Receipt</Text>
        <Text style={styles.subtitle}>
          Position your receipt within the frame and tap to capture
        </Text>
      </View>

      {/* Camera Section */}
      <View style={styles.cameraContainer}>
        <CameraView 
          style={styles.camera} 
          facing={facing}
          ref={cameraRef}
        >
          {/* Overlay with Frame */}
          <View style={styles.overlay}>
            <View style={styles.frameOverlay}>
              <View style={styles.frameBackground} />
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
              
              {/* Frame guide text */}
              <View style={styles.frameGuide}>
                <Text style={styles.frameGuideText}>
                  Align receipt within frame
                </Text>
              </View>
            </View>
          </View>

          {/* Camera Controls */}
          <View style={styles.controls}>
            <TouchableOpacity 
              style={styles.controlButton}
              onPress={toggleCameraFacing}
              activeOpacity={0.7}
            >
              <FlipHorizontal size={24} color={Colors.background} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={takePicture}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner}>
                <Camera size={32} color={Colors.background} />
              </View>
            </TouchableOpacity>
            
            <View style={styles.controlButton} />
          </View>
        </CameraView>
      </View>

      {/* Instructions Card */}
      <View style={styles.instructionsSection}>
        <Card style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Check size={20} color={Colors.accent} />
            <Text style={styles.instructionsTitle}>Tips for Best Results</Text>
          </View>
          
          <View style={styles.instructionsList}>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>Ensure good lighting conditions</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>Keep receipt flat and straight</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>Make sure all text is clearly visible</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionBullet}>•</Text>
              <Text style={styles.instructionText}>Avoid shadows and glare on the receipt</Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalHeaderButton}
              onPress={retakePhoto}
              activeOpacity={0.7}
            >
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Confirm Receipt</Text>
            <View style={styles.modalHeaderButton} />
          </View>

          {/* Image Preview */}
          <View style={styles.imageContainer}>
            <View style={styles.imageWrapper}>
              {capturedImage && (
                <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
              )}
            </View>
            
            <Text style={styles.imageHelperText}>
              Make sure the receipt is clear and all details are visible
            </Text>
          </View>

          {/* Modal Actions */}
          <View style={styles.modalActions}>
            <Button
              title="Retake Photo"
              variant="outline"
              onPress={retakePhoto}
              style={styles.modalButton}
              icon={<RotateCcw size={20} color={Colors.primary} />}
            />
            <Button
              title="Upload Receipt"
              onPress={handleUploadReceipt}
              loading={isUploading}
              style={styles.modalButton}
              icon={!isUploading ? <Upload size={20} color={Colors.background} /> : undefined}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: -42,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Header Styles
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  title: {
    ...Typography.title2,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 24,
    marginBottom: 8,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  
  // Permission Styles
  permissionIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  permissionButton: {
    minWidth: 200,
    paddingVertical: 16,
  },
  
  // Camera Styles
  cameraContainer: {
    flex: 1,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameOverlay: {
    width: '85%',
    height: '70%',
    position: 'relative',
  },
  frameBackground: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: Colors.background,
    borderWidth: 4,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -2,
    right: -2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  frameGuide: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  frameGuideText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  
  // Controls
  controls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  captureButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Instructions
  instructionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionsCard: {
    borderRadius: 16,
    padding: 20,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionsTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  instructionsList: {
    gap: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  instructionBullet: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
    width: 20,
    marginTop: 2,
  },
  instructionText: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  modalHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 20,
  },
  
  // Image Preview
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.backgroundSecondary,
  },
  imageWrapper: {
    width: '100%',
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  imageHelperText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  
  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
  },
});