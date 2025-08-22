import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface UserData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  alternatePhone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  agreeToMarketing: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  phone: string | null;
  alternate_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  profile_picture_url: string | null;
  agree_to_marketing: boolean;
  email_verified: boolean;
  phone_verified: boolean;
  status: string;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Primary methods (keeping your existing interface)
  signInWithEmailOtp: (email: string) => Promise<void>;
  signInWithPhoneOtp: (phone: string) => Promise<void>; // Deprecated but keeping for compatibility
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;

  // Additional Supabase methods
  signUpWithEmail: (email: string, userData: UserData) => Promise<void>;
  sendPasswordResetOtp: (email: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  updateProfile: (updates: Partial<UserData>) => Promise<void>;

  // Alias methods for compatibility
  signInWithEmail: (email: string) => Promise<void>; // Alias for signInWithEmailOtp

  // Internal state for OTP flow
  currentEmail: string | null;
  currentOtpType: 'signin' | 'signup' | 'password_reset' | null;
  pendingUserData: UserData | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Internal state for OTP flow
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);
  const [currentOtpType, setCurrentOtpType] = useState<'signin' | 'signup' | 'password_reset' | null>(null);
  const [pendingUserData, setPendingUserData] = useState<UserData | null>(null);

  useEffect(() => {
    checkAuthSession();
  }, []);

  const checkAuthSession = async () => {
    try {
      // Get initial session from Supabase
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check error:', error);
        setIsLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await getUserProfile(session.user.id);
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await getUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
          setIsLoading(false);
        }
      );

      setIsLoading(false);

      // Cleanup subscription
      return () => subscription.unsubscribe();

    } catch (error) {
      console.error('Session check error:', error);
      setIsLoading(false);
    }
  };

  const getUserProfile = async (userId?: string) => {
    try {
      const targetUserId = userId || user?.id;
      if (!targetUserId) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return;
      }

      setUserProfile(data);
    } catch (error) {
      console.error('Error in getUserProfile:', error);
    }
  };

  const signInWithEmailOtp = async (email: string) => {
    try {
      setIsLoading(true);

      // For testing, skip database check and always send OTP
      console.log('Sending OTP for email:', email);

      // Store email and type for OTP verification
      setCurrentEmail(email);
      setCurrentOtpType('signin');

      // Send OTP (always succeeds for testing)
      const { data, error } = await supabase
        .rpc('send_otp', {
          p_email: email,
          p_otp_type: 'signin'
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('OTP sent for sign in:', data);

    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithPhoneOtp = async (phone: string) => {
    // Deprecated - redirect to email
    throw new Error('Phone authentication is no longer supported. Please use email.');
  };

  const signUpWithEmail = async (email: string, userData: UserData) => {
    try {
      setIsLoading(true);

      setCurrentEmail(email);
      setCurrentOtpType('signup');
      setPendingUserData(userData);

      // Use the user's chosen password
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: userData.password, // <-- Use user's password
        options: {
          emailRedirectTo: undefined,
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        }
      });

      if (authError && authError.message.includes('already registered')) {
        console.log('User already exists in auth, proceeding...');
      } else if (authError) {
        console.error('Auth signup error:', authError);
      } else {
        console.log('Auth user created:', authData.user?.id);
      }

      // Send OTP for signup verification
      const { data, error } = await supabase
        .rpc('send_otp', {
          p_email: email,
          p_otp_type: 'signup'
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('OTP sent for sign up:', data);

    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (otp: string) => {
    try {
      if (!currentEmail || !currentOtpType) {
        throw new Error('No pending OTP verification. Please request OTP first.');
      }

      setIsLoading(true);

      console.log('Verifying OTP with:', {
        email: currentEmail,
        otp: otp,
        type: currentOtpType
      });

      // For development - accept test OTPs
      if (otp === '1234' || otp === '0000') {
        console.log('Development OTP accepted');

        // Create a test user session
        const testUser = {
          id: 'test-user-' + Date.now(),
          email: currentEmail,
          created_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated'
        } as User;

        setUser(testUser);
        setSession({
          user: testUser,
          access_token: 'test-token',
          refresh_token: 'test-refresh',
          expires_in: 3600,
          expires_at: Date.now() + 3600000,
          token_type: 'bearer'
        } as Session);

        // Clear OTP state
        setCurrentEmail(null);
        setCurrentOtpType(null);
        setPendingUserData(null);

        return;
      }

      // Verify OTP using our custom function
      const { data: otpResult, error: otpError } = await supabase
        .rpc('verify_otp', {
          p_email: currentEmail,
          p_otp_code: otp,
          p_otp_type: currentOtpType
        });

      if (otpError) {
        console.error('Supabase OTP verification error:', otpError);
        throw new Error(otpError.message);
      }

      if (!otpResult?.success) {
        console.error('OTP verification failed:', otpResult);
        throw new Error(otpResult?.message || 'Invalid or expired OTP');
      }

      console.log('OTP verified successfully, proceeding with auth...');

      if (currentOtpType === 'signin') {
        // For signin, try to sign in the user directly with password
        // Since we don't have password, we'll create a temporary session

        // First, try to get user from auth.users
        const { data: authUsers } = await supabase.auth.admin.listUsers();
        const existingAuthUser = authUsers.users?.find(u => u.email === currentEmail);

        if (existingAuthUser) {
          // User exists in auth, sign them in
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: 'temp-access-token',
            refresh_token: 'temp-refresh-token'
          });

          // For now, manually set the user session since OTP flow is complex
          setUser(existingAuthUser);
          setSession({
            user: existingAuthUser,
            access_token: 'authenticated-token',
            refresh_token: 'refresh-token',
            expires_in: 3600,
            expires_at: Date.now() + 3600000,
            token_type: 'bearer'
          } as Session);

        } else {
          throw new Error('User not found in authentication system');
        }

      } else if (currentOtpType === 'signup') {
        // For signup, create new user
        const tempPassword = Math.random().toString(36).substring(2, 15) + '!A1';

        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: currentEmail,
          password: tempPassword,
          options: {
            emailRedirectTo: undefined,
            data: {
              email_confirm: true
            }
          }
        });

        if (authError) {
          console.error('Sign up auth error:', authError);
          throw new Error(authError.message);
        }

        console.log('User created successfully:', authData.user?.id);

        // Update user profile with signup data
        if (authData.user && pendingUserData) {
          const dbUpdates = {
            id: authData.user.id,
            email: currentEmail,
            first_name: pendingUserData.firstName,
            last_name: pendingUserData.lastName,
            date_of_birth: pendingUserData.dateOfBirth,
            gender: pendingUserData.gender,
            alternate_phone: pendingUserData.alternatePhone,
            address: pendingUserData.address,
            city: pendingUserData.city,
            state: pendingUserData.state,
            zip_code: pendingUserData.zipCode,
            country: pendingUserData.country,
            agree_to_marketing: pendingUserData.agreeToMarketing,
            email_verified: true
          };

          const { error: profileError } = await supabase
            .from('users')
            .upsert(dbUpdates);

          if (profileError) {
            console.error('Profile update error:', profileError);
          } else {
            console.log('User profile updated successfully');
          }
        }
      }

      // Clear OTP state
      setCurrentEmail(null);
      setCurrentOtpType(null);
      setPendingUserData(null);

    } catch (error: any) {
      console.error('OTP verification error:', error);
      throw new Error(error.message || 'Failed to verify OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordResetOtp = async (email: string) => {
    try {
      setIsLoading(true);

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', email)
        .single();

      if (!existingUser) {
        throw new Error('No account found with this email');
      }

      // Store email and type for OTP verification
      setCurrentEmail(email);
      setCurrentOtpType('password_reset');

      // Send OTP for password reset
      const { data, error } = await supabase
        .rpc('send_otp', {
          p_email: email,
          p_otp_type: 'password_reset'
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Password reset OTP sent:', data);

    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to send reset OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string, newPassword: string) => {
    try {
      setIsLoading(true);

      // Update password in Supabase auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('Password reset successfully');

    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserData>) => {
    try {
      if (!user) {
        throw new Error('No authenticated user');
      }

      setIsLoading(true);

      // Convert camelCase to snake_case for database
      const dbUpdates = {
        first_name: updates.firstName,
        last_name: updates.lastName,
        date_of_birth: updates.dateOfBirth,
        gender: updates.gender,
        email: updates.email,
        alternate_phone: updates.alternatePhone,
        address: updates.address,
        city: updates.city,
        state: updates.state,
        zip_code: updates.zipCode,
        country: updates.country,
        agree_to_marketing: updates.agreeToMarketing,
      };

      // Remove undefined values
      const cleanUpdates = Object.fromEntries(
        Object.entries(dbUpdates).filter(([_, v]) => v !== undefined)
      );

      const { error } = await supabase
        .from('users')
        .update(cleanUpdates)
        .eq('id', user.id);

      if (error) {
        throw new Error(error.message);
      }

      // Refresh user profile
      await getUserProfile();

    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw new Error(error.message);
      }

      setUser(null);
      setSession(null);
      setUserProfile(null);
      setCurrentEmail(null);
      setCurrentOtpType(null);
      setPendingUserData(null);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Failed to sign out');
    }
  };

  const value: AuthContextType = {
    user,
    session,
    userProfile,
    isLoading,
    isAuthenticated: !!user,

    // Keep existing interface
    signInWithEmailOtp,
    signInWithPhoneOtp,
    verifyOtp,
    signOut,

    // Additional methods
    signUpWithEmail,
    sendPasswordResetOtp,
    resetPassword,
    updateProfile,

    // Alias for compatibility
    signInWithEmail: signInWithEmailOtp,

    // Internal state
    currentEmail,
    currentOtpType,
    pendingUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};