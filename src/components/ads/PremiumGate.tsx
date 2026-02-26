import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useAdsStore } from '../../store/adsStore';

interface PremiumGateProps {
  children: React.ReactNode;
  currentCount: number;
  maxFree: number;
  featureName?: string;
}

export function PremiumGate({ children, currentCount, maxFree, featureName = 'cette fonctionnalité' }: PremiumGateProps) {
  const isPremium = useAdsStore((s) => s.isPremium);
  const theme = useTheme();

  if (isPremium || currentCount < maxFree) {
    return <>{children}</>;
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onErrorContainer }]}>
          Limite atteinte
        </Text>
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          Vous avez atteint la limite de {maxFree} {featureName} gratuit(e)s.
          Passez Premium pour un accès illimité et sans publicité !
        </Text>
        <Button mode="contained" style={styles.button} onPress={() => {/* TODO: navigate to premium purchase */}}>
          Passer Premium
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: 12,
  },
  content: {
    alignItems: 'center',
    padding: 16,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  message: {
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
  },
});
