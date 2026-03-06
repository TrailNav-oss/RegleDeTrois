import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Card,
  IconButton,
  Menu,
  Divider,
  Chip,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdBanner } from '../../src/components/ads/AdBanner';
import { PremiumGate } from '../../src/components/ads/PremiumGate';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { scaleIngredients, adjustByIngredient } from '../../src/utils/crossMultiply';
import { useRecipeStore } from '../../src/store/recipeStore';
import { useAdsStore } from '../../src/store/adsStore';
import { ADS_CONFIG } from '../../src/config/ads';
import { useTranslation } from '../../src/i18n/useTranslation';
import { useIapStore } from '../../src/store/iapStore';
import { useUnitsStore } from '../../src/store/unitsStore';
import type { Unit, Ingredient, Recipe } from '../../src/types/recipe';

const METRIC_UNITS: Unit[] = ['g', 'kg', 'ml', 'L', 'cl', 'pièce', 'c.à.s', 'c.à.c'];
const IMPERIAL_UNITS: Unit[] = ['oz', 'lb', 'cup', 'fl oz', 'pièce', 'c.à.s', 'c.à.c'];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

type RecipeMode = 'classic' | 'adjusted';

export default function RecettesScreen() {
  const theme = useTheme();
  const { t } = useTranslation();

  const recipes = useRecipeStore((s) => s.recipes);
  const addRecipe = useRecipeStore((s) => s.addRecipe);
  const updateRecipe = useRecipeStore((s) => s.updateRecipe);
  const deleteRecipe = useRecipeStore((s) => s.deleteRecipe);
  const isPremium = useAdsStore((s) => s.isPremium);
  const showPurchaseModal = useIapStore((s) => s.showPurchaseModal);
  const unitSystem = useUnitsStore((s) => s.unitSystem);
  const UNITS = unitSystem === 'metric' ? METRIC_UNITS : IMPERIAL_UNITS;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState('');
  const [basePortions, setBasePortions] = useState('4');
  const [newPortions, setNewPortions] = useState('4');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: generateId(), name: '', qty: 0, unit: 'g' },
  ]);
  const [unitMenuVisible, setUnitMenuVisible] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  const [mode, setMode] = useState<RecipeMode>('classic');
  const [driverIngredientId, setDriverIngredientId] = useState<string | null>(null);
  const [adjustedValues, setAdjustedValues] = useState<Record<string, string>>({});

  const baseParsed = parseInt(basePortions, 10) || 0;
  const newParsed = parseInt(newPortions, 10) || 0;

  const scaledQuantities = scaleIngredients(ingredients, baseParsed, newParsed);

  const adjustedResult = useMemo(() => {
    if (mode !== 'adjusted' || !driverIngredientId) return null;
    const driverIndex = ingredients.findIndex((i) => i.id === driverIngredientId);
    if (driverIndex === -1) return null;
    const raw = adjustedValues[driverIngredientId];
    if (raw === undefined || raw === '') return null;
    const driverQty = parseFloat(raw.replace(',', '.'));
    if (isNaN(driverQty) || driverQty < 0) return null;

    return adjustByIngredient(ingredients, baseParsed, driverIndex, driverQty);
  }, [mode, driverIngredientId, adjustedValues, ingredients, baseParsed]);

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: generateId(), name: '', qty: 0, unit: 'g' },
    ]);
  };

  const removeIngredient = (id: string) => {
    if (ingredients.length <= 1) return;
    setIngredients((prev) => prev.filter((ing) => ing.id !== id));
    if (driverIngredientId === id) {
      setDriverIngredientId(null);
    }
    setAdjustedValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const updateIngredientField = (id: string, field: keyof Ingredient, value: string | number | Unit) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, [field]: value } : ing))
    );
  };

  const handleAdjustedQtyChange = (ingredientId: string, rawValue: string) => {
    setAdjustedValues((prev) => ({ ...prev, [ingredientId]: rawValue }));
    setDriverIngredientId(ingredientId);
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as RecipeMode);
    setDriverIngredientId(null);
    setAdjustedValues({});
  };

  const handleReset = () => {
    setEditingId(null);
    setRecipeName('');
    setBasePortions('4');
    setNewPortions('4');
    setIngredients([{ id: generateId(), name: '', qty: 0, unit: 'g' }]);
    setMode('classic');
    setDriverIngredientId(null);
    setAdjustedValues({});
  };

  const handleSave = () => {
    if (!recipeName.trim()) {
      Alert.alert(t('common.error'), t('recipes.errorNoName'));
      return;
    }
    const validIngredients = ingredients.filter((ing) => ing.name.trim() !== '');
    if (validIngredients.length === 0) {
      Alert.alert(t('common.error'), t('recipes.errorNoIngredient'));
      return;
    }

    const data = {
      name: recipeName.trim(),
      basePortions: baseParsed,
      ingredients: validIngredients,
    };

    if (editingId) {
      updateRecipe(editingId, data);
    } else {
      addRecipe(data);
    }

    handleReset();
    setShowEditor(false);
  };

  const handleLoadRecipe = (recipe: Recipe) => {
    setEditingId(recipe.id);
    setRecipeName(recipe.name);
    setBasePortions(recipe.basePortions.toString());
    setNewPortions(recipe.basePortions.toString());
    setIngredients(
      recipe.ingredients.map((ing) => ({ ...ing, id: ing.id || generateId() }))
    );
    setMode('classic');
    setDriverIngredientId(null);
    setAdjustedValues({});
    setShowEditor(true);
  };

  const handleDeleteRecipe = (recipe: Recipe) => {
    Alert.alert(
      t('recipes.delete'),
      t('recipes.deleteConfirm', { name: recipe.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('recipes.delete'),
          style: 'destructive',
          onPress: () => {
            deleteRecipe(recipe.id);
            if (editingId === recipe.id) {
              handleReset();
              setShowEditor(false);
            }
          },
        },
      ]
    );
  };

  const handleNewRecipe = () => {
    handleReset();
    setShowEditor(true);
  };

  const formatRatio = (r: number): string => {
    if (r === Math.floor(r)) return `×${r}`;
    return `×${r.toFixed(2)}`;
  };

  const renderIngredientClassic = (ingredient: Ingredient, index: number) => {
    const scaled = scaledQuantities[index];
    const hasChanged = baseParsed !== newParsed && ingredient.qty > 0;

    return (
      <Card
        key={ingredient.id}
        style={[styles.ingredientCard, { backgroundColor: theme.colors.surface }]}
      >
        <View style={styles.ingredientRow}>
          <View style={styles.ingredientFields}>
            <TextInput
              label={t('recipes.ingredient')}
              value={ingredient.name}
              onChangeText={(v) => updateIngredientField(ingredient.id, 'name', v)}
              mode="outlined"
              dense
              style={styles.nameInput}
              activeOutlineColor={theme.colors.primary}
            />
            <View style={styles.qtyUnitRow}>
              <TextInput
                label={t('recipes.qty')}
                value={ingredient.qty === 0 ? '' : ingredient.qty.toString()}
                onChangeText={(v) => {
                  const num = parseFloat(v.replace(',', '.'));
                  updateIngredientField(ingredient.id, 'qty', isNaN(num) ? 0 : num);
                }}
                keyboardType="numeric"
                mode="outlined"
                dense
                style={styles.qtyInput}
                activeOutlineColor={theme.colors.primary}
              />
              <Menu
                visible={unitMenuVisible === ingredient.id}
                onDismiss={() => setUnitMenuVisible(null)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setUnitMenuVisible(ingredient.id)}
                    compact
                    style={styles.unitButton}
                    labelStyle={styles.unitLabel}
                  >
                    {ingredient.unit}
                  </Button>
                }
              >
                {UNITS.map((unit) => (
                  <Menu.Item
                    key={unit}
                    title={unit}
                    onPress={() => {
                      updateIngredientField(ingredient.id, 'unit', unit);
                      setUnitMenuVisible(null);
                    }}
                  />
                ))}
              </Menu>
            </View>

            {hasChanged && (
              <View style={styles.scaledRow}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {ingredient.qty} {ingredient.unit}
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                  {' → '}{scaled} {ingredient.unit}
                </Text>
              </View>
            )}
          </View>

          <IconButton
            icon="delete-outline"
            size={22}
            onPress={() => removeIngredient(ingredient.id)}
            iconColor={theme.colors.error}
            disabled={ingredients.length <= 1}
          />
        </View>
      </Card>
    );
  };

  const renderIngredientAdjusted = (ingredient: Ingredient, index: number) => {
    const isDriver = driverIngredientId === ingredient.id;
    const rawValue = adjustedValues[ingredient.id] ?? '';
    const computedQty = adjustedResult?.quantities[index];
    const displayQty = isDriver
      ? rawValue
      : computedQty !== undefined
        ? computedQty.toString()
        : '';
    const canDrive = ingredient.qty > 0;

    return (
      <Card
        key={ingredient.id}
        style={[
          styles.ingredientCard,
          {
            backgroundColor: isDriver
              ? theme.colors.primaryContainer
              : theme.colors.surface,
            borderWidth: isDriver ? 2 : 0,
            borderColor: isDriver ? theme.colors.primary : 'transparent',
          },
        ]}
      >
        <View style={styles.ingredientRow}>
          <View style={styles.ingredientFields}>
            <View style={styles.adjustedNameRow}>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: '600', flex: 1 }}
              >
                {ingredient.name || t('recipes.noName')}
              </Text>
              {isDriver && adjustedResult && (
                <Chip
                  compact
                  style={[styles.ratioBadge, { backgroundColor: theme.colors.primary }]}
                  textStyle={{ color: theme.colors.onPrimary, fontSize: 11, fontWeight: 'bold' }}
                >
                  {formatRatio(adjustedResult.ratio)}
                </Chip>
              )}
            </View>

            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('recipes.baseLabel', { qty: ingredient.qty, unit: ingredient.unit })}
            </Text>

            <View style={styles.qtyUnitRow}>
              <TextInput
                label={canDrive ? t('recipes.newQty') : t('recipes.qtyBaseZero')}
                value={displayQty}
                onChangeText={(v) => {
                  if (!canDrive) return;
                  handleAdjustedQtyChange(ingredient.id, v);
                }}
                keyboardType="numeric"
                mode="outlined"
                dense
                disabled={!canDrive}
                style={[
                  styles.qtyInput,
                  isDriver && { backgroundColor: theme.colors.primaryContainer },
                ]}
                activeOutlineColor={theme.colors.primary}
                outlineColor={isDriver ? theme.colors.primary : theme.colors.outline}
              />
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, minWidth: 40 }}>
                {ingredient.unit}
              </Text>
            </View>
          </View>

          <IconButton
            icon="delete-outline"
            size={22}
            onPress={() => removeIngredient(ingredient.id)}
            iconColor={theme.colors.error}
            disabled={ingredients.length <= 1}
          />
        </View>
      </Card>
    );
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => {
    const ingCount = item.ingredients.length;
    const ingLabel = ingCount > 1
      ? t('recipes.ingredientCountPlural', { count: ingCount })
      : t('recipes.ingredientCount', { count: ingCount });

    return (
      <TouchableOpacity onPress={() => handleLoadRecipe(item)} activeOpacity={0.7}>
        <Card style={[styles.recipeListCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.recipeListRow}>
            <View style={styles.recipeListInfo}>
              <Text variant="titleSmall" style={{ color: theme.colors.onSurface }}>
                {item.name}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {ingLabel} · {t('recipes.portionCount', { count: item.basePortions })}
              </Text>
            </View>
            <IconButton
              icon="delete-outline"
              size={20}
              onPress={() => handleDeleteRecipe(item)}
              iconColor={theme.colors.error}
            />
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  // Recipe list view
  if (!showEditor) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.flex}>
          <View style={styles.listHeader}>
            <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
              {t('recipes.title')}
            </Text>
            <View style={styles.listHeaderRight}>
              {!isPremium && (
                <Chip icon="information" style={styles.counterChip} textStyle={{ fontSize: 12 }}>
                  {t('recipes.freeCount', { count: recipes.length, max: ADS_CONFIG.MAX_FREE_RECIPES })}
                </Chip>
              )}
              <IconButton
                icon="help-circle-outline"
                size={24}
                onPress={() => Alert.alert(t('recipes.helpTitle'), t('recipes.helpBody'))}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
          </View>

          {recipes.length === 0 ? (
            <EmptyState
              icon="book-open-blank-variant"
              title={t('recipes.noRecipes')}
              message={t('recipes.noRecipesMessage')}
            />
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={(item) => item.id}
              renderItem={renderRecipeItem}
              contentContainerStyle={styles.listContent}
            />
          )}

          <PremiumGate
            currentCount={recipes.length}
            maxFree={ADS_CONFIG.MAX_FREE_RECIPES}
            featureName={t('tabs.recipes').toLowerCase()}
            onPressPremium={showPurchaseModal}
          >
            <Button
              mode="contained"
              onPress={handleNewRecipe}
              icon="plus"
              style={styles.newRecipeButton}
            >
              {t('recipes.newRecipe')}
            </Button>
          </PremiumGate>
        </View>
        <AdBanner />
      </SafeAreaView>
    );
  }

  // Editor view
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.editorHeader}>
            <IconButton
              icon="arrow-left"
              onPress={() => {
                handleReset();
                setShowEditor(false);
              }}
              iconColor={theme.colors.onBackground}
            />
            <Text variant="titleLarge" style={[styles.editorTitle, { color: theme.colors.onBackground }]}>
              {editingId ? t('recipes.edit') : t('recipes.newRecipe')}
            </Text>
          </View>

          <TextInput
            label={t('recipes.recipeName')}
            value={recipeName}
            onChangeText={setRecipeName}
            mode="outlined"
            style={styles.recipeNameInput}
            activeOutlineColor={theme.colors.primary}
          />

          {/* Mode toggle */}
          {editingId && ingredients.some((i) => i.qty > 0) && (
            <SegmentedButtons
              value={mode}
              onValueChange={handleModeChange}
              buttons={[
                { value: 'classic', label: t('recipes.classic'), icon: 'arrow-right' },
                { value: 'adjusted', label: t('recipes.adjusted'), icon: 'swap-horizontal' },
              ]}
              style={styles.modeToggle}
            />
          )}

          {/* Portions section */}
          {mode === 'classic' ? (
            <View style={styles.portionsRow}>
              <TextInput
                label={t('recipes.basePortions')}
                value={basePortions}
                onChangeText={setBasePortions}
                keyboardType="numeric"
                mode="outlined"
                dense
                style={styles.portionInput}
                activeOutlineColor={theme.colors.primary}
              />
              <Text variant="headlineSmall" style={{ color: theme.colors.primary, marginHorizontal: 12 }}>
                →
              </Text>
              <TextInput
                label={t('recipes.newPortions')}
                value={newPortions}
                onChangeText={setNewPortions}
                keyboardType="numeric"
                mode="outlined"
                dense
                style={styles.portionInput}
                activeOutlineColor={theme.colors.primary}
              />
            </View>
          ) : (
            <Card style={[styles.portionsCard, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Card.Content style={styles.portionsCardContent}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer }}>
                  {t('recipes.basePortionsLabel', { count: baseParsed })}
                </Text>
                {adjustedResult ? (
                  <View style={styles.adjustedPortionsRow}>
                    <Text
                      variant="headlineSmall"
                      style={{ color: theme.colors.primary, fontWeight: 'bold' }}
                    >
                      {t('recipes.portions', { count: adjustedResult.portions })}
                    </Text>
                    <Chip
                      compact
                      style={[styles.ratioBadge, { backgroundColor: theme.colors.primary }]}
                      textStyle={{ color: theme.colors.onPrimary, fontSize: 12, fontWeight: 'bold' }}
                    >
                      {formatRatio(adjustedResult.ratio)}
                    </Chip>
                  </View>
                ) : (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer }}>
                    {t('recipes.modifyIngredient')}
                  </Text>
                )}
              </Card.Content>
            </Card>
          )}

          <Divider style={styles.divider} />

          <Text variant="titleMedium" style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
            {t('recipes.ingredients')}
          </Text>

          {mode === 'classic'
            ? ingredients.map((ing, i) => renderIngredientClassic(ing, i))
            : ingredients.map((ing, i) => renderIngredientAdjusted(ing, i))
          }

          {mode === 'classic' && (
            <Button
              mode="contained-tonal"
              onPress={addIngredient}
              icon="plus"
              style={styles.addButton}
            >
              {t('recipes.addIngredient')}
            </Button>
          )}

          <View style={styles.actionsRow}>
            <Button
              mode="outlined"
              onPress={() => {
                handleReset();
                setShowEditor(false);
              }}
              style={styles.actionButton}
              textColor={theme.colors.onSurfaceVariant}
            >
              {t('recipes.cancel')}
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.actionButton}
              icon="content-save"
            >
              {t('recipes.save')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <AdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontWeight: 'bold',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  listHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterChip: {
    height: 28,
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
  },
  recipeListCard: {
    marginBottom: 10,
    borderRadius: 14,
    elevation: 2,
  },
  recipeListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 8,
  },
  recipeListInfo: {
    flex: 1,
    gap: 4,
  },
  newRecipeButton: {
    margin: 20,
    borderRadius: 12,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  editorTitle: {
    fontWeight: 'bold',
  },
  recipeNameInput: {
    marginBottom: 16,
  },
  modeToggle: {
    marginBottom: 16,
  },
  portionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  portionInput: {
    flex: 1,
  },
  portionsCard: {
    borderRadius: 14,
    marginBottom: 16,
  },
  portionsCardContent: {
    gap: 6,
  },
  adjustedPortionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 12,
  },
  ingredientCard: {
    marginBottom: 12,
    borderRadius: 14,
    elevation: 1,
    padding: 10,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientFields: {
    flex: 1,
    gap: 8,
  },
  adjustedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratioBadge: {
    height: 24,
    borderRadius: 12,
  },
  nameInput: {
    fontSize: 14,
  },
  qtyUnitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyInput: {
    flex: 1,
    fontSize: 14,
  },
  unitButton: {
    minWidth: 60,
    borderRadius: 8,
  },
  unitLabel: {
    fontSize: 13,
  },
  scaledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    marginTop: 2,
  },
  addButton: {
    marginTop: 12,
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    borderRadius: 12,
    paddingHorizontal: 20,
  },
});
