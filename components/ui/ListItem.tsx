import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  TextStyle 
} from 'react-native';
import { Colors, Spacing, Typography } from '../../constants/Colors';

interface ListItemProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  rightElement,
  leftElement,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {leftElement && (
        <View style={styles.leftElement}>
          {leftElement}
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>
        )}
      </View>

      {rightElement && (
        <View style={styles.rightElement}>
          {rightElement}
        </View>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  leftElement: {
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  rightElement: {
    marginLeft: Spacing.md,
  },
  title: {
    ...Typography.body,
    color: Colors.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});