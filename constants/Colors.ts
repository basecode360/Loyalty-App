// constants/Colors.ts
export const Colors = {
  // niche. brand colors from brand guide
  primary: '#000000', // Black - primary brand color
  primaryLight: '#D8DAD7', // Light gray from brand guide
  secondary: '#C3C3C3', // Medium gray from brand guide
  accent: '#152D05', // Deep green accent from brand guide
  background: '#FFFFFF', // White background
  backgroundSecondary: '#D8DAD7', // Light gray secondary background
  text: '#000000', // Black text to match niche. branding
  textSecondary: '#6b7280', // Keep existing secondary text
  textLight: '#9ca3af', // Keep existing light text
  border: '#C3C3C3', // Use brand gray for borders
  error: '#FF2800', // Red from brand guide
  warning: '#f59e0b', // Keep existing warning
  success: '#6CD83F', // Green from brand guide
  surface: '#FFFFFF', // White surface
  shadow: '#00000010', // Keep existing shadow
  overlay: '#00000080', // Keep existing overlay
  // Additional niche. brand colors
  brandAccentBlue: '#6F82C6',
  brandAccentTeal: '#11826F',
  brandAccentBrown: '#BFBBA2',
  brandAccentPurple: '#3D32A6',
  brandAccentNavy: '#0C154C',
  brandAccentMaroon: '#773635',
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