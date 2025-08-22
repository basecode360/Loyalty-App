import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const getButtonStyles = () => {
    const baseStyle = [styles.button];
    const baseTextStyle = [styles.buttonText];

    // Variant styles
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        baseTextStyle.push(styles.secondaryButtonText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        baseTextStyle.push(styles.outlineButtonText);
        break;
      default:
        baseStyle.push(styles.primaryButton);
        baseTextStyle.push(styles.primaryButtonText);
    }

    // Size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        baseTextStyle.push(styles.smallButtonText);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        baseTextStyle.push(styles.largeButtonText);
        break;
      default:
        baseStyle.push(styles.mediumButton);
        baseTextStyle.push(styles.mediumButtonText);
    }

    // Disabled styles
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
      baseTextStyle.push(styles.disabledButtonText);
    }

    return { buttonStyle: baseStyle, textStyle: baseTextStyle };
  };

  const { buttonStyle, textStyle: computedTextStyle } = getButtonStyles();

  return (
    <TouchableOpacity
      style={[...buttonStyle, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? Colors.background : Colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={[...computedTextStyle, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontWeight: '600',
  },

  // Variants
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    color: Colors.background,
  },
  secondaryButton: {
    backgroundColor: Colors.backgroundSecondary,
  },
  secondaryButtonText: {
    color: Colors.text,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  outlineButtonText: {
    color: Colors.primary,
  },

  // Sizes
  smallButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 48,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    minHeight: 56,
  },
  largeButtonText: {
    fontSize: 18,
  },

  // States
  disabledButton: {
    opacity: 0.6,
  },
  disabledButtonText: {
    opacity: 0.6,
  },
});