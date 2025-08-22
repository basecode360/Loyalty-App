import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  Image,
  ActionSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, Upload, User, Calendar, X, Check, Edit2 } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/Colors';

export default function ProfileInfoScreen() {
  const router = useRouter();
  const { userProfile, updateProfile, user } = useAuth();
  
  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [agreeToMarketing, setAgreeToMarketing] = useState(false);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  const genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];

  useEffect(() => {
    // Load existing profile data from Supabase
    if (userProfile) {
      console.log('Loading profile data:', userProfile);
      
      setFirstName(userProfile.first_name || '');
      setLastName(userProfile.last_name || '');
      setEmail(userProfile.email || user?.email || '');
      setPhone(userProfile.phone || '');
      setAlternatePhone(userProfile.alternate_phone || '');
      setGender(userProfile.gender || '');
      setAddress(userProfile.address || '');
      setCity(userProfile.city || '');
      setState(userProfile.state || '');
      setZipCode(userProfile.zip_code || '');
      setCountry(userProfile.country || 'Pakistan');
      setAgreeToMarketing(userProfile.agree_to_marketing || false);
      setProfilePictureUrl(userProfile.profile_picture_url || '');
      
      // Format date of birth for display
      if (userProfile.date_of_birth) {
        const dobDate = new Date(userProfile.date_of_birth);
        setSelectedDate(dobDate);
        setDateOfBirth(formatDateForInput(dobDate));
      }
    }
  }, [userProfile, user]);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = formatDateForInput(selectedDate);
      setDateOfBirth(formattedDate);
    }
  };

  const formatDateForInput = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Profile Picture',
      'Choose how you want to set your profile picture',
      [
        {
          text: 'Camera',
          onPress: openCamera,
        },
        {
          text: 'Gallery',
          onPress: openGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Camera permission is needed to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera. Please try again.');
    }
  };

  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Gallery permission is needed to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery. Please try again.');
    }
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploading(true);
      console.log('Uploading profile picture:', imageUri);

      // For now, we'll store the local URI
      // In production, you'd upload to Supabase storage
      setProfilePictureUrl(imageUri);
      
      // TODO: Implement actual upload to Supabase storage
      // const { data, error } = await supabase.storage
      //   .from('profile-pictures')
      //   .upload(`${user.id}/avatar.jpg`, imageFile);

      console.log('Profile picture uploaded successfully');
      Alert.alert('Success', 'Profile picture updated successfully!');

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const validateForm = () => {
    const errors = [];

    // Only validate editable fields
    if (!phone && phone !== '') {
      // Phone is optional, so no error if empty
    }
    
    if (zipCode && country === 'Pakistan' && !/^\d{4}$/.test(zipCode)) {
      errors.push('ZIP code must be exactly 4 digits for Pakistan');
    }

    if (errors.length > 0) {
      Alert.alert('Please fix the following errors:', errors.join('\n'));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      console.log('Saving profile updates...');

      const updates = {
        // Don't update non-editable fields
        // firstName, lastName, email, dateOfBirth are read-only
        gender,
        address,
        city,
        state,
        zipCode,
        country,
        agreeToMarketing,
        alternatePhone,
        // Add profile picture URL when implemented
      };

      await updateProfile(updates);

      Alert.alert(
        'Success!',
        'Your profile has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (error: any) {
      console.error('Profile update error:', error);
      Alert.alert('Error', error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getUserInitials = () => {
    const first = firstName || userProfile?.first_name || '';
    const last = lastName || userProfile?.last_name || '';
    if (first && last) {
      return (first[0] + last[0]).toUpperCase();
    }
    return first.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Information</Text>
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <LoadingSpinner size={20} />
          ) : (
            <Check size={24} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Information Notice */}
        <Card style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <User size={20} color={Colors.primary} />
            <Text style={styles.infoTitle}>Personal Information</Text>
          </View>
          <Text style={styles.infoDescription}>
            Your name, email, and date of birth cannot be changed for security reasons. 
            Contact support if you need to update these details.
          </Text>
          <View style={styles.infoStats}>
            <Text style={styles.infoStatText}>
              Account created: {userProfile?.created_at ? 
                new Date(userProfile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 
                'Unknown'
              }
            </Text>
          </View>
        </Card>
        {/* Profile Picture Section */}
        <Card style={styles.pictureCard}>
          <View style={styles.pictureSection}>
            <View style={styles.avatarContainer}>
              {profilePictureUrl ? (
                <Image source={{ uri: profilePictureUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getUserInitials()}</Text>
                </View>
              )}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <LoadingSpinner size={24} />
                </View>
              )}
            </View>
            <View style={styles.pictureInfo}>
              <Text style={styles.pictureTitle}>Profile Picture</Text>
              <Text style={styles.pictureSubtitle}>
                Add a photo to personalize your account
              </Text>
              <TouchableOpacity 
                style={styles.changePictureButton}
                onPress={handleImagePicker}
                disabled={uploading}
              >
                <Camera size={16} color={Colors.primary} />
                <Text style={styles.changePictureText}>
                  {profilePictureUrl ? 'Change Picture' : 'Add Picture'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <Card>
            {/* Non-editable Fields */}
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>First Name</Text>
                <View style={[styles.input, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{firstName || 'Not set'}</Text>
                </View>
                <Text style={styles.readOnlyNote}>Cannot be changed</Text>
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Last Name</Text>
                <View style={[styles.input, styles.readOnlyInput]}>
                  <Text style={styles.readOnlyText}>{lastName || 'Not set'}</Text>
                </View>
                <Text style={styles.readOnlyNote}>Cannot be changed</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.input, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>{email || 'Not set'}</Text>
              </View>
              <Text style={styles.readOnlyNote}>Cannot be changed</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth</Text>
              <View style={[styles.datePickerButton, styles.readOnlyInput]}>
                <Text style={styles.readOnlyText}>
                  {dateOfBirth || 'Not set'}
                </Text>
                <Calendar size={16} color={Colors.textLight} />
              </View>
              <Text style={styles.readOnlyNote}>Cannot be changed</Text>
            </View>

            {/* Editable Fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender</Text>
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
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number (e.g., +92 300 1234567)"
                placeholderTextColor={Colors.textLight}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              {phone && phone.length > 0 && phone.length < 10 && (
                <Text style={styles.validationText}>
                  Phone number should be at least 10 digits
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alternate Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Alternate phone number (optional)"
                placeholderTextColor={Colors.textLight}
                value={alternatePhone}
                onChangeText={setAlternatePhone}
                keyboardType="phone-pad"
              />
            </View>
          </Card>
        </View>

        {/* Address Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Address Information</Text>
          
          <Card>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Street Address</Text>
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
                <Text style={styles.label}>City</Text>
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
                <Text style={styles.label}>State/Province</Text>
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
                <Text style={styles.label}>ZIP/Postal Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ZIP Code"
                  placeholderTextColor={Colors.textLight}
                  value={zipCode}
                  onChangeText={setZipCode}
                  keyboardType="numeric"
                  maxLength={country === 'Pakistan' ? 4 : undefined}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Country</Text>
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
          </Card>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <Card>
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
          </Card>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundSecondary,
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
  infoCard: {
    margin: Spacing.lg,
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  infoTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginLeft: Spacing.sm,
  },
  infoDescription: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  infoStats: {
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: `${Colors.primary}20`,
  },
  infoStatText: {
    ...Typography.caption,
    color: Colors.textLight,
  },
  pictureCard: {
    margin: Spacing.lg,
  },
  pictureSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    ...Typography.title2,
    color: Colors.background,
    fontWeight: '700',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pictureInfo: {
    flex: 1,
  },
  pictureTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  pictureSubtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  changePictureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.primary}15`,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  changePictureText: {
    ...Typography.caption,
    color: Colors.primary,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.bodyBold,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    ...Typography.body,
    color: Colors.text,
    flex: 1,
    lineHeight: 22,
  },
  validationText: {
    ...Typography.small,
    color: Colors.warning,
    marginTop: Spacing.xs,
  },
  readOnlyInput: {
    backgroundColor: `${Colors.textLight}10`,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  readOnlyText: {
    ...Typography.body,
    color: Colors.textSecondary,
    paddingVertical: 0,
  },
  readOnlyNote: {
    ...Typography.small,
    color: Colors.textLight,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
});
