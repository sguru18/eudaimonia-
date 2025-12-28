import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { colors, typography } from '../theme';

interface HeaderProps {
  children: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: TextStyle;
  align?: 'left' | 'center' | 'right';
}

export const Header: React.FC<HeaderProps> = ({
  children,
  size = 'medium',
  color = colors.text,
  style,
  align = 'left',
}) => {
  const getHeaderStyle = (): TextStyle => {
    switch (size) {
      case 'large':
        return typography.headerLarge;
      case 'small':
        return typography.headerSmall;
      default:
        return typography.headerMedium;
    }
  };

  return (
    <Text
      style={[
        getHeaderStyle(),
        { color, textAlign: align },
        styles.header,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  header: {
    // Cursive font is applied via typography
  },
});

