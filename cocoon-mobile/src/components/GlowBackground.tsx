import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme/colors';

interface Props {
  children: React.ReactNode;
  variant?: 'home' | 'docs' | 'settings';
}

export function GlowBackground({ children }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.bg} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgPrimary,
  },
});
