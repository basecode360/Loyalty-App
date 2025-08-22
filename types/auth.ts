export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  dateOfBirth?: string;
  pointsBalance: number;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signInWithEmailOtp: (email: string) => Promise<void>;
  signInWithPhoneOtp: (phone: string) => Promise<void>;
  verifyOtp: (otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}