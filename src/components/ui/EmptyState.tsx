import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, useTheme, Icon } from 'react-native-paper';

interface EmptyStateProps {
  icon: string;
  title: string;
  message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Icon
        source={icon}
        size={64}
        color={theme.colors.outlineVariant}
      />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurfaceVariant }]}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.outline }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 8,
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 8,
  },
  message: {
    textAlign: 'center',
  },
});
