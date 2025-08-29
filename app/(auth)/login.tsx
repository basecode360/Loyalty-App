import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { NicheLogo } from '../../components/ui/NicheLogo';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

export default function LoginScreen() {
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    if (isLoading) return;

    // Validation
    if (!validateEmail(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    try {
      await signInWithPassword(email, password);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Login error:', error.message);
      
      // Show user-friendly error messages
      let alertTitle = 'Sign In Failed';
      let alertMessage = error.message;
      
      if (error.message.includes('Email or password is incorrect')) {
        alertTitle = 'Invalid Credentials';
        alertMessage = 'The email or password you entered is incorrect. Please check your details and try again.';
      } else if (error.message.includes('verify your email')) {
        alertTitle = 'Email Not Verified';
        alertMessage = 'Please check your email and verify your account before signing in.';
      } else if (error.message.includes('Too many')) {
        alertTitle = 'Too Many Attempts';
        alertMessage = 'You have made too many login attempts. Please wait a few minutes and try again.';
      } else if (error.message.includes('No account found')) {
        alertTitle = 'Account Not Found';
        alertMessage = 'No account exists with this email address. Please check your email or create a new account.';
      }
      
      Alert.alert(alertTitle, alertMessage, [
        { 
          text: 'OK',
          onPress: () => {
            // Clear password field on error
            if (error.message.includes('Email or password is incorrect')) {
              setPassword('');
            }
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const isValid = validateEmail(email) && password.length >= 8;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.logoContainer}>
            <NicheLogo size="large" showTagline={true} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to your account
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[
                styles.input,
                email && !validateEmail(email) && styles.inputError
              ]}
              placeholder="Enter your email address"
              placeholderTextColor={Colors.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {email && !validateEmail(email) && (
              <Text style={styles.errorText}>Please enter a valid email</Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textLight}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            disabled={!isValid}
            loading={isLoading}
            size="large"
            style={styles.button}
          />

          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={() => router.push('/(auth)/forgot-password')}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signUpContainer}
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.signUpText}>
              Don't have an account? <Text style={styles.signUpLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    paddingTop: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
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
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    ...Typography.caption,
    color: Colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '600',
  },
  input: {
    ...Typography.body,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    minHeight: 56,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    ...Typography.small,
    color: '#FF3B30',
    marginTop: Spacing.xs,
  },
  passwordContainer: {
    position: 'relative',
  },
  eyeButton: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 24,
  },
  eyeText: {
    fontSize: 16,
  },
  button: {
    width: '100%',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.body,
    color: Colors.primary,
    fontWeight: '600',
  },
  signUpContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  signUpText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signUpLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
  disclaimer: {
    ...Typography.small,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
});