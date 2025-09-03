// components/ui/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '../../constants/Colors';
import { StatusColors } from '../../constants/Colors';

type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'processing' | 'queued' | 'approved' | 'rejected' | 'duplicate';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ 
  text, 
  variant = 'primary', 
  style,
  textStyle 
}) => {
  const getBadgeStyles = (variant: BadgeVariant) => {
    switch (variant) {
      case 'success':
      case 'approved':
        return {
          backgroundColor: `${Colors.success}15`,
          borderColor: Colors.success,
          textColor: Colors.success,
        };
      case 'warning':
      case 'processing':
        return {
          backgroundColor: `${StatusColors.processing}15`,
          borderColor: StatusColors.processing,
          textColor: StatusColors.processing,
        };
      case 'error':
      case 'rejected':
        return {
          backgroundColor: `${Colors.error}15`,
          borderColor: Colors.error,
          textColor: Colors.error,
        };
      case 'queued':
        return {
          backgroundColor: `${StatusColors.queued}15`,
          borderColor: StatusColors.queued,
          textColor: StatusColors.queued,
        };
      case 'duplicate':
        return {
          backgroundColor: `${StatusColors.duplicate}15`,
          borderColor: StatusColors.duplicate,
          textColor: StatusColors.duplicate,
        };
      default:
        return {
          backgroundColor: `${Colors.primary}15`,
          borderColor: Colors.primary,
          textColor: Colors.primary,
        };
    }
  };

  const badgeStyles = getBadgeStyles(variant);

  return (
    <View style={[
      styles.badge,
      {
        backgroundColor: badgeStyles.backgroundColor,
        borderColor: badgeStyles.borderColor,
      },
      style
    ]}>
      <Text style={[
        styles.text,
        { color: badgeStyles.textColor },
        textStyle
      ]}>
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    ...Typography.small,
    fontWeight: '600',
  },
});