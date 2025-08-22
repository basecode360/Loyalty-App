import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

export default function OTPVerificationScreen() {
  const router = useRouter();
  const { verifyOtp, signUpWithEmail, sendPasswordResetOtp } = useAuth();
  const { method, contact, type, userData } = useLocalSearchParams();
  
  const otpLength = 4; // 4-digit OTP for all flows
  const initialOtp = new Array(otpLength).fill('');
  
  const [otp, setOtp] = useState(initialOtp);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleOtpChange = (value, index) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < otpLength - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key, index) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length !== otpLength) {
      Alert.alert('Invalid OTP', `Please enter all ${otpLength} digits`);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Verifying OTP:', {
        email: contact,
        otp: otpString,
        type: type
      });

      // Call the verify OTP function from auth context
      const result = await verifyOtp(String(contact), otpString, String(type));
      
      if (result.success) {
        // Navigate based on type
        if (type === 'forgot-password') {
          router.push({
            pathname: '/(auth)/reset-password',
            params: { contact, method }
          });
        } else if (type === 'signup') {
          // Complete the signup process
          if (userData) {
            const parsedUserData = JSON.parse(String(userData));
            // Account created successfully during OTP verification
            router.replace('/(tabs)');
          } else {
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/(tabs)');
        }
      } else {
        throw new Error(result.message || 'Invalid OTP');
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      Alert.alert(
        'Verification Failed', 
        error.message || 'Invalid OTP. Please try again.',
        [
          { text: 'OK', onPress: () => {
            setOtp(initialOtp);
            inputRefs.current[0]?.focus();
          }}
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setTimer(60);
      setOtp(initialOtp);
      inputRefs.current[0]?.focus();
      
      if (type === 'forgot-password') {
        await sendPasswordResetOtp(String(contact));
        Alert.alert('Success', 'Reset code sent to your email');
      } else if (type === 'signup') {
        // Resend signup OTP
        await signUpWithEmail(String(contact), userData ? JSON.parse(String(userData)) : {});
        Alert.alert('Success', 'Verification code sent to your email');
      }
      
      console.log('OTP resent successfully');
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    }
  };

  const isValid = otp.every(digit => digit !== '');

  const getTitle = () => {
    if (type === 'forgot-password') return 'Enter Reset Code';
    if (type === 'signup') return 'Verify Your Email';
    return 'Enter Verification Code';
  };

  const getSubtitle = () => {
    if (type === 'forgot-password') {
      return `We sent a ${otpLength}-digit reset code to ${contact}`;
    } else if (type === 'signup') {
      return `We sent a ${otpLength}-digit verification code to ${contact}`;
    }
    return `We sent a ${otpLength}-digit verification code to ${contact}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>L</Text>
            </View>
            <Text style={styles.appName}>LoyaltyApp</Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>
              {getSubtitle()}
            </Text>
            <Text style={styles.note}>
              Check your email and enter the code below
            </Text>
          </View>

          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) {
                    inputRefs.current[index] = ref;
                  }
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                ]}
                value={digit}
                onChangeText={(value) => handleOtpChange(value, index)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                autoFocus={index === 0}
                selectTextOnFocus
              />
            ))}
          </View>

          <Button
            title={type === 'forgot-password' ? 'Verify Reset Code' : 'Verify & Continue'}
            onPress={handleVerifyOTP}
            disabled={!isValid}
            loading={isLoading}
            size="large"
            style={styles.button}
          />

          <View style={styles.resendContainer}>
            {timer > 0 ? (
              <Text style={styles.timerText}>
                Resend code in {timer}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendText}>
                  Didn't receive the code? Resend
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.helpText}>
            Having trouble? Check your spam folder or contact support
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    paddingTop: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logoText: {
    ...Typography.title3,
    color: Colors.background,
    fontWeight: '700',
  },
  appName: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
  },
  backButtonText: {
    ...Typography.body,
    color: Colors.primary,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    ...Typography.title1,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  note: {
    ...Typography.small,
    color: Colors.textLight,
    textAlign: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.sm,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    backgroundColor: Colors.backgroundSecondary,
  },
  otpInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  button: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  resendContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  timerText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  resendText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  helpText: {
    ...Typography.small,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});