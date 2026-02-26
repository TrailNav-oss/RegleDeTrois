import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { useAdsStore } from '../../store/adsStore';
import { useTranslation } from '../../i18n/useTranslation';

interface PremiumGateProps {
  children: React.ReactNode;
  currentCount: number;
  maxFree: number;
  featureName?: string;
  onPressPremium?: () => void;
}

export function PremiumGate({ children, currentCount, maxFree, featureName, onPressPremium }: PremiumGateProps) {
  const isPremium = useAdsStore((s) => s.isPremium);
  const theme = useTheme();
  const { t } = useTranslation();

  if (isPremium || currentCount < maxFree) {
    return <>{children}</>;
  }

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.errorContainer }]}>
      <Card.Content style={styles.content}>
        <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onErrorContainer }]}>
          {t('premiumGate.limitReached')}
        </Text>
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
          {t('premiumGate.limitMessage', { max: maxFree, feature: featureName ?? t('tabs.recipes') })}
        </Text>
        <Button mode="contained" style={styles.button} onPress={onPressPremium ?? (() => {})}>
          {t('premiumGate.goPremium')}
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
