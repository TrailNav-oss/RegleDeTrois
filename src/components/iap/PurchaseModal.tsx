import React, { useEffect } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, Card, useTheme, Icon, ActivityIndicator } from 'react-native-paper';
import { useIapStore } from '../../store/iapStore';
import { useTranslation } from '../../i18n/useTranslation';

export function PurchaseModal() {
  const theme = useTheme();
  const { t } = useTranslation();
  const {
    purchaseModalVisible,
    products,
    loading,
    error,
    hidePurchaseModal,
    loadProducts,
    purchase,
    restore,
  } = useIapStore();

  useEffect(() => {
    if (purchaseModalVisible && products.length === 0) {
      loadProducts();
    }
  }, [purchaseModalVisible, products.length, loadProducts]);

  const product = products[0];
  const price = product?.displayPrice ?? '—';

  const handleRestore = async () => {
    const found = await restore();
    if (found) {
      hidePurchaseModal();
    }
  };

  return (
    <Modal
      visible={purchaseModalVisible}
      transparent
      animationType="slide"
      onRequestClose={hidePurchaseModal}
    >
      <View style={styles.overlay}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.content}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <Icon source="star" size={40} color={theme.colors.primary} />
            </View>

            <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onSurface }]}>
              Premium
            </Text>

            <View style={styles.features}>
              <FeatureRow icon="close-circle-outline" text={t('profile.premiumDescription').split(' · ')[0]} color={theme.colors.primary} />
              <FeatureRow icon="infinity" text={t('profile.premiumDescription').split(' · ')[1]} color={theme.colors.primary} />
              <FeatureRow icon="cloud-sync" text={t('profile.premiumDescription').split(' · ')[2]} color={theme.colors.primary} />
            </View>

            {loading ? (
              <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
            ) : (
              <>
                <Button
                  mode="contained"
                  onPress={purchase}
                  style={styles.purchaseButton}
                  icon="star"
                >
                  {t('profile.goPremium')} — {price}
                </Button>

                <Button
                  mode="text"
                  onPress={handleRestore}
                  style={styles.restoreButton}
                  textColor={theme.colors.onSurfaceVariant}
                >
                  {t('profile.restorePurchases')}
                </Button>
              </>
            )}

            {error && (
              <Text variant="bodySmall" style={{ color: theme.colors.error, textAlign: 'center', marginTop: 8 }}>
                {error}
              </Text>
            )}

            <Button
              mode="text"
              onPress={hidePurchaseModal}
              style={styles.closeButton}
              textColor={theme.colors.onSurfaceVariant}
            >
              {t('common.cancel')}
            </Button>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
}

function FeatureRow({ icon, text, color }: { icon: string; text: string; color: string }) {
  return (
    <View style={styles.featureRow}>
      <Icon source={icon} size={20} color={color} />
      <Text variant="bodyMedium" style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 20,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  features: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  loader: {
    marginVertical: 20,
  },
  purchaseButton: {
    borderRadius: 12,
    width: '100%',
  },
  restoreButton: {
    marginTop: 8,
  },
  closeButton: {
    marginTop: 4,
  },
});
