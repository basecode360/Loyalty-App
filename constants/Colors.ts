export const Colors = {
  primary: '#1e3a8a', // Dark blue
  primaryLight: '#3b82f6',
  secondary: '#6b7280', // Gray
  accent: '#10b981', // Subtle green
  background: '#ffffff',
  backgroundSecondary: '#f8fafc',
  text: '#1f2937',
  textSecondary: '#6b7280',
  textLight: '#9ca3af',
  border: '#e5e7eb',
  error: '#ef4444',
  warning: '#f59e0b',
  success: '#10b981',
  surface: '#ffffff',
  shadow: '#00000010',
  overlay: '#00000080',
};

export const StatusColors = {
  processing: '#f59e0b',
  queued: '#6366f1',
  approved: '#10b981',
  rejected: '#ef4444',
  duplicate: '#9ca3af',
};

// Missing constants - ye add kariye:
export const Typography = {
  title1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  title2: {
    fontSize: 28,
    fontWeight: '600' as const,
    lineHeight: 36,
  },
  title3: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

// Bonus: Common shadows for consistency
export const Shadows = {
  small: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};