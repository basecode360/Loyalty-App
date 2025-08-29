import React from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import { Colors, Typography } from '../../constants/Colors';

interface NicheLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'black' | 'white' | 'text-only';
  showTagline?: boolean;
  style?: any;
}

export const NicheLogo: React.FC<NicheLogoProps> = ({ 
  size = 'medium', 
  variant = 'black',
  showTagline = false,
  style 
}) => {
  const getLogoSize = () => {
    switch (size) {
      case 'small':
        return { width: 80, height: 30 };
      case 'large':
        return { width: 120, height: 45 };
      default:
        return { width: 100, height: 38 };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 42;
      default:
        return 32;
    }
  };

  const getTaglineSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 16;
      default:
        return 12;
    }
  };

  if (variant === 'text-only') {
    return (
      <View style={[styles.container, style]}>
        <Text 
          style={[
            styles.logoText, 
            { 
              fontSize: getTextSize(),
              color: variant === 'white' ? Colors.background : Colors.text 
            }
          ]}
        >
          niche.
        </Text>
        {showTagline && (
          <Text 
            style={[
              styles.tagline, 
              { 
                fontSize: getTaglineSize(),
                color: variant === 'white' ? Colors.background : Colors.textSecondary
              }
            ]}
          >
            Not for Everyone
          </Text>
        )}
      </View>
    );
  }

  const logoSource = variant === 'white' 
    ? require('../../assets/PNG/niche-white.png')
    : require('../../assets/PNG/niche-black.png');

  return (
    <View style={[styles.container, style]}>
      <Image 
        source={logoSource}
        style={[styles.logoImage, getLogoSize()]}
        resizeMode="contain"
      />
      {showTagline && (
        <Text 
          style={[
            styles.tagline, 
            { 
              fontSize: getTaglineSize(),
              color: variant === 'white' ? Colors.background : Colors.textSecondary
            }
          ]}
        >
          Not for Everyone
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoImage: {
    marginBottom: 4,
  },
  logoText: {
    fontFamily: 'System', // Will use Nicholas Bold when available
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontFamily: 'System', // Will use cursive font when available
    fontStyle: 'italic',
    opacity: 0.8,
    marginTop: 2,
  },
});