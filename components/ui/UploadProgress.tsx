// components/ui/UploadProgress.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';
import { Colors, Typography } from '../../constants/Colors';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react-native';

interface UploadProgressProps {
  visible: boolean;
  progress: number; // 0-100
  stage: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
  onComplete?: () => void;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  visible,
  progress,
  stage,
  message,
  onComplete
}) => {
  const animatedProgress = new Animated.Value(progress);

  React.useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  React.useEffect(() => {
    if (stage === 'complete' && onComplete) {
      const timer = setTimeout(onComplete, 1500);
      return () => clearTimeout(timer);
    }
  }, [stage, onComplete]);

  const getStageInfo = () => {
    switch (stage) {
      case 'uploading':
        return {
          icon: <Upload size={32} color={Colors.primary} />,
          title: 'Uploading Receipt',
          subtitle: 'Sending image to secure storage...',
        };
      case 'processing':
        return {
          icon: <Upload size={32} color={Colors.primary} />,
          title: 'Processing Receipt',
          subtitle: 'Extracting receipt data with AI...',
        };
      case 'complete':
        return {
          icon: <CheckCircle size={32} color={Colors.accent} />,
          title: 'Upload Complete!',
          subtitle: message || 'Receipt processed successfully',
        };
      case 'error':
        return {
          icon: <AlertCircle size={32} color={Colors.error} />,
          title: 'Upload Failed',
          subtitle: message || 'Please try again',
        };
      default:
        return {
          icon: <Upload size={32} color={Colors.primary} />,
          title: 'Uploading...',
          subtitle: '',
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            {stageInfo.icon}
          </View>
          
          <Text style={styles.title}>{stageInfo.title}</Text>
          <Text style={styles.subtitle}>{stageInfo.subtitle}</Text>
          
          {stage !== 'error' && stage !== 'complete' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: animatedProgress.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>{Math.round(progress)}%</Text>
            </View>
          )}
          
          {stage === 'processing' && (
            <View style={styles.processingSteps}>
              <Text style={styles.stepText}>📸 Image uploaded</Text>
              <Text style={styles.stepText}>🤖 AI analyzing receipt...</Text>
              <Text style={styles.stepText}>⏳ Checking for duplicates...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  container: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 280,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    ...Typography.title3,
    color: Colors.text,
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...Typography.bodyBold,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  processingSteps: {
    marginTop: 20,
    alignItems: 'center',
  },
  stepText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
    textAlign: 'center',
  },
});
