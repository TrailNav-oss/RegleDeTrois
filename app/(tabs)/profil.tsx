import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Card,
  Switch,
  Divider,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';
import { useAdsStore } from '../../src/store/adsStore';
import { useThemeStore } from '../../src/store/themeStore';
import { useRecipeStore } from '../../src/store/recipeStore';
import { PremiumGate } from '../../src/components/ads/PremiumGate';
import { syncRecipes } from '../../src/utils/syncService';

export default function ProfilScreen() {
  const theme = useTheme();

  const { user, loading, error, signIn, signUp, logout, clearError, initAuth, initialized } = useAuthStore();
  const isPremium = useAdsStore((s) => s.isPremium);
  const togglePremium = useAdsStore((s) => s.togglePremium);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const toggleDarkMode = useThemeStore((s) => s.toggleDarkMode);
  const recipes = useRecipeStore((s) => s.recipes);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth();
    return unsubscribe;
  }, [initAuth]);

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (isSignUp) {
      await signUp(email.trim(), password);
    } else {
      await signIn(email.trim(), password);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    if (!isPremium) {
      Alert.alert('Premium requis', 'La synchronisation cloud est réservée aux utilisateurs Premium.');
      return;
    }
    setSyncing(true);
    try {
      const merged = await syncRecipes(user.uid, recipes);
      // Replace local store with merged results
      const store = useRecipeStore.getState();
      // Clear and re-add all
      for (const r of store.recipes) {
        store.deleteRecipe(r.id);
      }
      for (const r of merged) {
        // Directly set via internal state manipulation
        useRecipeStore.setState((state) => ({
          recipes: [...state.recipes.filter((x) => x.id !== r.id), r],
        }));
      }
      Alert.alert('Succès', `${merged.length} recette(s) synchronisée(s).`);
    } catch (err: any) {
      Alert.alert('Erreur de sync', err.message || 'Impossible de synchroniser.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Déconnexion', 'Voulez-vous vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: logout },
    ]);
  };

  if (!initialized) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Profil
        </Text>

        {/* Auth Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            {user ? (
              <View style={styles.loggedInSection}>
                <View style={styles.userInfoRow}>
                  <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
                    Connecté
                  </Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    {user.email}
                  </Text>
                </View>

                <View style={styles.syncSection}>
                  {isPremium ? (
                    <Button
                      mode="contained-tonal"
                      onPress={handleSync}
                      loading={syncing}
                      disabled={syncing}
                      icon="cloud-sync"
                      style={styles.syncButton}
                    >
                      Synchroniser ({recipes.length} recettes)
                    </Button>
                  ) : (
                    <View style={[styles.syncGate, { backgroundColor: theme.colors.secondaryContainer }]}>
                      <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, textAlign: 'center' }}>
                        Passez Premium pour synchroniser vos recettes dans le cloud.
                      </Text>
                    </View>
                  )}
                </View>

                <Button
                  mode="outlined"
                  onPress={handleLogout}
                  textColor={theme.colors.error}
                  style={styles.logoutButton}
                >
                  Déconnexion
                </Button>
              </View>
            ) : (
              <View style={styles.authForm}>
                <Text variant="titleMedium" style={[styles.authTitle, { color: theme.colors.onSurface }]}>
                  {isSignUp ? 'Créer un compte' : 'Connexion'}
                </Text>

                <TextInput
                  label="Email"
                  value={email}
                  onChangeText={(v) => { setEmail(v); clearError(); }}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.authInput}
                  activeOutlineColor={theme.colors.primary}
                />
                <TextInput
                  label="Mot de passe"
                  value={password}
                  onChangeText={(v) => { setPassword(v); clearError(); }}
                  mode="outlined"
                  secureTextEntry
                  style={styles.authInput}
                  activeOutlineColor={theme.colors.primary}
                />

                {error && (
                  <Text variant="bodySmall" style={{ color: theme.colors.error, marginBottom: 8 }}>
                    {error}
                  </Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleAuth}
                  loading={loading}
                  disabled={loading}
                  style={styles.authButton}
                >
                  {isSignUp ? "S'inscrire" : 'Se connecter'}
                </Button>

                <Button
                  mode="text"
                  onPress={() => { setIsSignUp(!isSignUp); clearError(); }}
                  style={styles.toggleAuth}
                >
                  {isSignUp ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Settings Section */}
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.settingsTitle, { color: theme.colors.onSurface }]}>
              Paramètres
            </Text>

            <View style={styles.settingRow}>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                Mode sombre
              </Text>
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} color={theme.colors.primary} />
            </View>

            <Divider style={styles.settingDivider} />

            {/* Premium toggle (dev only) */}
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  Premium
                </Text>
                {__DEV__ && (
                  <Chip compact style={styles.devChip} textStyle={{ fontSize: 10 }}>
                    DEV
                  </Chip>
                )}
              </View>
              <Switch value={isPremium} onValueChange={togglePremium} color={theme.colors.primary} />
            </View>

            {!isPremium && (
              <>
                <Divider style={styles.settingDivider} />
                <Button
                  mode="contained"
                  onPress={() => Alert.alert('Premium', 'Les achats in-app seront disponibles prochainement.')}
                  style={styles.premiumButton}
                  icon="star"
                >
                  Passer Premium
                </Button>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>
                  Sans pub · Recettes illimitées · Sync cloud
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        <Text variant="bodySmall" style={[styles.version, { color: theme.colors.onSurfaceVariant }]}>
          Règle de Trois v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 20,
  },
  loggedInSection: {
    gap: 16,
  },
  userInfoRow: {
    gap: 4,
  },
  syncSection: {
    gap: 8,
  },
  syncButton: {
    borderRadius: 8,
  },
  syncGate: {
    padding: 12,
    borderRadius: 8,
  },
  logoutButton: {
    borderRadius: 8,
  },
  authForm: {
    gap: 4,
  },
  authTitle: {
    fontWeight: '600',
    marginBottom: 8,
  },
  authInput: {
    marginBottom: 8,
  },
  authButton: {
    borderRadius: 8,
    marginTop: 4,
  },
  toggleAuth: {
    marginTop: 4,
  },
  settingsTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingDivider: {
    marginVertical: 8,
  },
  devChip: {
    height: 20,
  },
  premiumButton: {
    borderRadius: 8,
    marginTop: 8,
  },
  version: {
    textAlign: 'center',
    marginTop: 8,
  },
});
