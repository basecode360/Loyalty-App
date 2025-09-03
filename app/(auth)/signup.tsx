// app/(auth)/signup.tsx
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { NicheLogo } from '../../components/ui/NicheLogo';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUpWithEmail } = useAuth();

  // Personal Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [gender, setGender] = useState('');

  // Contact Information
  const [email, setEmail] = useState('');

  // Address Information
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('USA');

  // Password
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Agreement
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  // Validation Functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateZipCode = (zip) => {
    // USA postal codes: exactly 4 digits
    const usaZipRegex = /^\d{5}$/;

    if (country === 'USA') {
      return usaZipRegex.test(zip);
    }
    
    // For other countries, keep flexible validation
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    const ukPostcodeRegex = /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i;
    
    if (country === 'United States') {
      return usZipRegex.test(zip);
    } else if (country === 'United Kingdom') {
      return ukPostcodeRegex.test(zip);
    }
    
    // General validation for other countries - at least 3 characters
    return zip.length >= 3;
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasMinLength = password.length >= 8;
    
    return {
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      isValid: hasMinLength && hasUpperCase && hasLowerCase && hasNumber
    };
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDate(selectedDate);
      setDateOfBirth(formattedDate);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const openDatePicker = () => {
    setShowDatePicker(true);
  };

  const validateForm = () => {
    const errors = [];

    if (!firstName.trim()) errors.push('First name is required');
    if (!lastName.trim()) errors.push('Last name is required');
    if (!dateOfBirth || dateOfBirth.length < 10) errors.push('Valid date of birth is required');
    if (!gender) errors.push('Gender selection is required');
    
    if (!validateEmail(email)) errors.push('Valid email address is required');

    if (!address.trim()) errors.push('Address is required');
    if (!city.trim()) errors.push('City is required');
    if (!state.trim()) errors.push('State/Province is required');
    if (!validateZipCode(zipCode)) {
      if (country === 'USA') {
        errors.push('ZIP code must be exactly 5 digits for USA');
      } else {
        errors.push(`Valid ZIP/Postal code is required for ${country}`);
      }
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push('Password must meet all requirements (8+ characters, uppercase, lowercase, number)');
    }
    
    if (password !== confirmPassword) errors.push('Passwords do not match');
    if (!agreeToTerms) errors.push('You must agree to Terms and Conditions');

    if (errors.length > 0) {
      Alert.alert('Please fix the following errors:', errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSendOTP = async () => {
    if (isLoading) return;
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const userData = {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        email,
        address,
        city,
        state,
        zipCode,
        country,
        password,
        agreeToMarketing
      };

      await signUpWithEmail(email, userData);

      router.push({
        pathname: '/(auth)/otp-verification',
        params: {
          method: 'email',
          contact: email,
          type: 'signup',
          userData: JSON.stringify(userData)
        }
      });
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Error', error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);
  const isFormValid = firstName.trim() && lastName.trim() && dateOfBirth.length === 10 &&
    gender && validateEmail(email) &&
    address.trim() && city.trim() && state.trim() && validateZipCode(zipCode) &&
    passwordValidation.isValid && password === confirmPassword && agreeToTerms;

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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Fill in your details to create a new account
            </Text>
          </View>

          {/* Personal Information Section */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="First name"
                  placeholderTextColor={Colors.textLight}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Last name"
                  placeholderTextColor={Colors.textLight}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth * (DD/MM/YYYY)</Text>
              <TouchableOpacity style={styles.datePickerButton} onPress={openDatePicker}>
                <Text style={[styles.datePickerText, !dateOfBirth && styles.placeholderText]}>
                  {dateOfBirth || 'Select your date of birth'}
                </Text>
                <Text style={styles.calendarIcon}>📅</Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                  minimumDate={new Date(1900, 0, 1)}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.genderScrollContainer}
              >
                <View style={styles.genderContainer}>
                  {genderOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.genderOption,
                        gender === option && styles.genderOptionSelected
                      ]}
                      onPress={() => setGender(option)}
                    >
                      <Text style={[
                        styles.genderText,
                        gender === option && styles.genderTextSelected
                      ]}>
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address *</Text>
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
                <Text style={styles.errorText}>Please enter a valid email address</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Street Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full address"
                placeholderTextColor={Colors.textLight}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>City *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="City"
                  placeholderTextColor={Colors.textLight}
                  value={city}
                  onChangeText={setCity}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>State/Province *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="State"
                  placeholderTextColor={Colors.textLight}
                  value={state}
                  onChangeText={setState}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>ZIP/Postal Code *</Text>
                <TextInput
                  style={[
                    styles.input,
                    zipCode && !validateZipCode(zipCode) && styles.inputError
                  ]}
                  placeholder="ZIP Code"
                  placeholderTextColor={Colors.textLight}
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                  maxLength={country === 'USA' ? 5 : undefined}
                />
                {zipCode && !validateZipCode(zipCode) && (
                  <Text style={styles.errorText}>
                    {country === 'USA' ? '5 digits required' : 'Invalid format'}
                  </Text>
                )}
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Country *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Country"
                  placeholderTextColor={Colors.textLight}
                  value={country}
                  onChangeText={setCountry}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Create a strong password"
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={Colors.textLight}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
              {confirmPassword && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}
            </View>

            {password.length > 0 && (
              <View style={styles.passwordRequirements}>
                <Text style={[styles.requirement, passwordValidation.hasMinLength && styles.requirementMet]}>
                  • At least 8 characters
                </Text>
                <Text style={[styles.requirement, passwordValidation.hasUpperCase && styles.requirementMet]}>
                  • One uppercase letter
                </Text>
                <Text style={[styles.requirement, passwordValidation.hasLowerCase && styles.requirementMet]}>
                  • One lowercase letter
                </Text>
                <Text style={[styles.requirement, passwordValidation.hasNumber && styles.requirementMet]}>
                  • One number
                </Text>
              </View>
            )}
          </View>

          {/* Agreements Section */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the <Text style={styles.link}>Terms & Conditions</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text> *
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setAgreeToMarketing(!agreeToMarketing)}
            >
              <View style={[styles.checkbox, agreeToMarketing && styles.checkboxChecked]}>
                {agreeToMarketing && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.checkboxText}>
                I want to receive promotional emails and marketing communications
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Create Account"
            onPress={handleSendOTP}
            disabled={!isFormValid}
            loading={isLoading}
            size="large"
            style={styles.button}
          />

          <TouchableOpacity 
            style={styles.signInContainer}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign In</Text>
            </Text>
          </TouchableOpacity>
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
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
  section: {
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  halfWidth: {
    width: '48%',
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
    minHeight: 48,
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
  datePickerButton: {
    ...Typography.body,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    minHeight: 48,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerText: {
    ...Typography.body,
    color: Colors.text,
    flex: 1,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  calendarIcon: {
    fontSize: 16,
    marginLeft: Spacing.sm,
  },
  genderScrollContainer: {
    flexGrow: 1,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: 2,
  },
  genderOption: {
    backgroundColor: Colors.backgroundSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 80,
    alignItems: 'center',
  },
  genderOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genderText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  genderTextSelected: {
    color: Colors.background,
    fontWeight: '600',
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
  passwordRequirements: {
    marginTop: Spacing.sm,
  },
  requirement: {
    ...Typography.small,
    color: Colors.textLight,
    marginBottom: 2,
  },
  requirementMet: {
    color: Colors.primary,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: Colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  checkboxText: {
    ...Typography.small,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  link: {
    color: Colors.primary,
    fontWeight: '600',
  },
  button: {
    width: '100%',
    marginBottom: Spacing.lg,
    marginTop: Spacing.md,
  },
  signInContainer: {
    alignItems: 'center',
  },
  signInText: {
    ...Typography.body,
    color: Colors.textSecondary,
  },
  signInLink: {
    color: Colors.primary,
    fontWeight: '600',
  },
});