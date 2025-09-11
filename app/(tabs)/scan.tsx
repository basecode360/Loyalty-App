// app/(tabs)/scan.tsx
import React, { useState, useRef, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, X, Check, RotateCcw, FlipHorizontal } from 'lucide-react-native';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { UploadProgress } from '../../components/ui/UploadProgress';
import { Colors, Typography, Spacing } from '../../constants/Colors';
import { useRealtimeReceipts } from '../../hooks/useRealtimeReceipts';
import * as api from '../../services/api';
import * as ImageManipulator from 'expo-image-manipulator';

export default function ScanScreen() {
  const router = useRouter();
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraKey, setCameraKey] = useState(0); // Force camera re-mount
  
  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'uploading' | 'processing' | 'complete' | 'error'>('uploading');
  const [showUploadProgress, setShowUploadProgress] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  
  const cameraRef = useRef<CameraView>(null);
  
  // Initialize real-time receipt updates
  useRealtimeReceipts();

  // Reset camera state when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      // Reset all states
      setCameraReady(false);
      setShowConfirmation(false);
      setCapturedImage(null);
      setShowUploadProgress(false);
      setUploadProgress(0);
      setUploadMessage('');
      setUploadStage('uploading');
      
      // Force camera component to re-mount with new key
      setCameraKey(prev => prev + 1);
      
      // Delay camera ready to ensure proper initialization
      const timer = setTimeout(() => {
        setCameraReady(true);
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }, [])
  );

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
    if (!cameraReady) {
      Alert.alert('Please Wait', 'Camera is initializing...');
      return;
    }

    if (!cameraRef.current) {
      Alert.alert(
        'Camera Error', 
        'Camera is not ready. Please wait a moment and try again.'
      );
      // Re-initialize camera
      setCameraReady(false);
      setTimeout(() => setCameraReady(true), 1000);
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.3,
        base64: false,
        skipProcessing: true,
      });

      if (photo?.uri) {
        setCapturedImage(photo.uri);
        setShowConfirmation(true);
      }
    } catch (error: any) {
      console.error('Error taking picture:', error);
      
      Alert.alert(
        'Camera Error',
        'Failed to capture image. Please try again.',
        [
          { 
            text: 'OK', 
            onPress: () => {
              // Reset camera
              setCameraKey(prev => prev + 1);
              setCameraReady(false);
              setTimeout(() => setCameraReady(true), 1000);
            }
          }
        ]
      );
    }
  };

  const handleUploadReceipt = async () => {
    if (!capturedImage) return;

    setShowUploadProgress(true);
    setUploadStage('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Compress image
      setUploadProgress(20);
      console.log('Compressing image...');

      const manipulatedImage = await ImageManipulator.manipulateAsync(
        capturedImage,
        [{ resize: { width: 800 } }],
        { compress: 0.3, format: ImageManipulator.SaveFormat.JPEG }
      );

      setUploadProgress(40);
      console.log('Compressed image URI:', manipulatedImage.uri);

      // Step 2: Upload and process
      setUploadProgress(60);
      setUploadStage('processing');

      const receipt = await api.submitReceipt(manipulatedImage.uri);

      // Step 3: Complete
      setUploadProgress(100);
      setUploadStage('complete');
      
      let message = '';
      // Force any rejected status to be treated as queued
      const actualStatus = receipt.status === 'rejected' ? 'queued' : receipt.status;
      
      if (actualStatus === 'approved') {
        message = `Receipt approved! ${receipt.pointsAwarded || 0} points earned.`;
      } else if (actualStatus === 'queued' || receipt.status === 'rejected') {
        // Show queued message for both queued and any old rejected receipts
        message = 'Receipt submitted for review. You\'ll be notified within 24 hours.';
      } else if (actualStatus === 'duplicate') {
        message = 'This receipt has already been submitted.';
      } else {
        message = 'Receipt submitted successfully!';
      }
      
      setUploadMessage(message);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStage('error');
      
      // Filter out any quality-related error messages and replace with generic message
      let errorMessage = error.message || 'Upload failed. Please try again.';
      if (errorMessage.toLowerCase().includes('quality') || 
          errorMessage.toLowerCase().includes('clearer') ||
          errorMessage.toLowerCase().includes('rejected')) {
        errorMessage = 'Receipt submitted for review. You\'ll be notified within 24 hours.';
        setUploadStage('complete'); // Change to complete instead of error
      }
      
      setUploadMessage(errorMessage);
    }
  };

  const handleUploadComplete = () => {
    setShowUploadProgress(false);
    setShowConfirmation(false);
    setCapturedImage(null);
    
    if (uploadStage === 'complete') {
      // Small delay before navigation
      setTimeout(() => {
        router.push('/(tabs)/receipts');
      }, 100);
    } else {
      // Reset camera for retry
      setCameraKey(prev => prev + 1);
      setCameraReady(false);
      setTimeout(() => setCameraReady(true), 500);
    }
  };

  const retakePhoto = () => {
    setShowConfirmation(false);
    setCapturedImage(null);
    // Reset camera
    setCameraKey(prev => prev + 1);
    setCameraReady(false);
    setTimeout(() => setCameraReady(true), 500);
  };

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  const onCameraReady = () => {
    console.log('Camera is ready');
    setCameraReady(true);
  };

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
        {cameraReady && permission?.granted ? (
          <CameraView
            key={cameraKey} // Force re-mount with key
            style={styles.camera}
            facing={facing}
            ref={cameraRef}
            onCameraReady={onCameraReady}
          />
        ) : (
          <View style={[styles.camera, styles.cameraLoading]}>
            <LoadingSpinner size={48} />
            <Text style={styles.cameraLoadingText}>Initializing camera...</Text>
          </View>
        )}

        {cameraReady && (
          <>
            <View style={styles.overlay}>
              <View style={styles.frameOverlay}>
                <View style={styles.frameBackground} />
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                <View style={styles.frameGuide}>
                  <Text style={styles.frameGuideText}>
                    Align receipt within frame
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={toggleCameraFacing}
                activeOpacity={0.7}
              >
                <FlipHorizontal size={14} color={Colors.background} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.captureButton}
                onPress={takePicture}
                activeOpacity={0.8}
                disabled={!cameraReady}
              >
                <View style={[
                  styles.captureButtonInner,
                  !cameraReady && styles.captureButtonDisabled
                ]}>
                  <Camera size={32} color={Colors.background} />
                </View>
              </TouchableOpacity>

              <View style={styles.controlButton} />
            </View>
          </>
        )}
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

      {/* Upload Progress Modal */}
      <UploadProgress
        visible={showUploadProgress}
        progress={uploadProgress}
        stage={uploadStage}
        message={uploadMessage}
        onComplete={handleUploadComplete}
      />

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView style={styles.modalContainer}>
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
              style={styles.modalButton}
              icon={<Upload size={20} color={Colors.background} />}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// Styles remain the same as original
const styles = StyleSheet.create({
  // ... all the original styles
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
  cameraLoading: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
  },
  cameraLoadingText: {
    marginTop: 16,
    color: Colors.textSecondary,
    fontSize: 16,
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
  captureButtonDisabled: {
    backgroundColor: Colors.textLight,
    opacity: 0.5,
  },
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