import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme, Icon } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../src/i18n/useTranslation';

export default function TabLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          elevation: 2,
          borderTopWidth: 0.5,
          height: 60 + insets.bottom,
          paddingBottom: 6 + insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.simple'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="calculator-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recettes"
        options={{
          title: t('tabs.recipes'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="book-open-variant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color, size }) => (
            <Icon source="account-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
