// lib/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debug: Log environment variables
console.log('Supabase URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('Supabase Key exists:', !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

// Use environment variables for production
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if credentials are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials!');
  console.error('URL:', supabaseUrl);
  console.error('Key available:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Use AsyncStorage for session persistence
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
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
        };
        Insert: {
          id: string;
          email: string;
          first_name: string;
          last_name: string;
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          alternate_phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          profile_picture_url?: string | null;
          agree_to_marketing?: boolean;
          email_verified?: boolean;
          phone_verified?: boolean;
          status?: string;
          loyalty_points?: number;
        };
        Update: {
          email?: string;
          first_name?: string;
          last_name?: string;
          date_of_birth?: string | null;
          gender?: string | null;
          phone?: string | null;
          alternate_phone?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string;
          profile_picture_url?: string | null;
          agree_to_marketing?: boolean;
          email_verified?: boolean;
          phone_verified?: boolean;
          status?: string;
          updated_at?: string;
        };
      };
      otp_verifications: {
        Row: {
          id: string;
          email: string;
          otp_code: string;
          otp_type: string;
          expires_at: string;
          verified: boolean;
          attempts: number;
          created_at: string;
        };
        Insert: {
          email: string;
          otp_code: string;
          otp_type: string;
          expires_at: string;
          verified?: boolean;
          attempts?: number;
        };
        Update: {
          verified?: boolean;
          attempts?: number;
        };
      };
      loyalty_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: string;
          points: number;
          description: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          transaction_type: string;
          points: number;
          description?: string | null;
          reference_id?: string | null;
        };
        Update: {
          points?: number;
          description?: string | null;
          reference_id?: string | null;
        };
      };
    };
    Functions: {
      send_otp: {
        Args: {
          p_email: string;
          p_otp_type: string;
        };
        Returns: {
          success: boolean;
          message: string;
          otp?: string;
          expires_at?: string;
        };
      };
      verify_otp: {
        Args: {
          p_email: string;
          p_otp_code: string;
          p_otp_type: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
    };
  };
}