import React from 'react';
import { StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { BookOpen, Settings as SettingsIcon } from 'lucide-react-native';
import { theme } from '../../src/theme/tokens';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.text.muted,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hoy',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size ?? 22} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon size={size ?? 22} color={color} strokeWidth={2} />
          ),
        }}
      />
      {/* Timeline oculta en v1 conforme a P-003 */}
      <Tabs.Screen
        name="timeline"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.colors.background.card,
    borderTopColor: theme.colors.border.subtle,
    borderTopWidth: 1,
    height: Platform.OS === 'android' ? 68 : 84,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'android' ? theme.spacing.sm : theme.spacing.lg,
    elevation: 8,
  },
  tabBarItem: {
    minHeight: theme.accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBarLabel: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.medium,
    marginTop: 2,
  },
});
