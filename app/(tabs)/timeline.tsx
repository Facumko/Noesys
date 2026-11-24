import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../src/theme/tokens';

/**
 * Ruta reservada para la versión 1.1 (Pospuesta en PLAN.md).
 * Está oculta en el tab bar (href: null).
 */
export default function TimelineScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Línea de tiempo (v1.1)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: theme.colors.text.muted,
    fontSize: theme.typography.sizes.base,
  },
});
