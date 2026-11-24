import { Tabs } from 'expo-router';
import { theme } from '../src/theme/tokens';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.background.card },
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.border.subtle,
      }}>
      <Tabs.Screen name="(tabs)/index" options={{ title: 'Inicio' }} />
      <Tabs.Screen name="subject/[id]" options={{ title: 'Detalle' }} />
      <Tabs.Screen name="focus-timer" options={{ title: 'Timer' }} />
      <Tabs.Screen name="(tabs)/settings" options={{ title: 'Ajustes' }} />
    </Tabs>
  );
}
