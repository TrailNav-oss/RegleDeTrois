import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  FlatList,
  type ViewToken,
} from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useOnboardingStore } from '../../store/onboardingStore';

const { width } = Dimensions.get('window');

const slides = [
  {
    icon: 'calculator-variant',
    title: 'Règle de trois simple',
    description: 'Remplissez 3 valeurs, la 4e se calcule instantanément. Simple, rapide, efficace.',
  },
  {
    icon: 'book-open-variant',
    title: 'Convertissez vos recettes',
    description: 'Ajustez les quantités de vos ingrédients en changeant le nombre de portions.',
  },
  {
    icon: 'star-outline',
    title: 'Gratuit avec pubs',
    description: 'Profitez de l\'app gratuitement. Passez Premium pour un accès illimité sans publicité.',
  },
];

export function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const goNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryContainer }]}>
              <MaterialCommunityIcons
                name={item.icon}
                size={64}
                color={theme.colors.primary}
              />
            </View>
            <Text variant="headlineSmall" style={[styles.slideTitle, { color: theme.colors.onBackground }]}>
              {item.title}
            </Text>
            <Text variant="bodyLarge" style={[styles.slideDesc, { color: theme.colors.onSurfaceVariant }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex ? styles.dotActive : null,
                {
                  backgroundColor:
                    i === currentIndex ? theme.colors.primary : theme.colors.outlineVariant,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.buttons}>
          {currentIndex < slides.length - 1 && (
            <Button mode="text" onPress={completeOnboarding} textColor={theme.colors.onSurfaceVariant}>
              Passer
            </Button>
          )}
          <Button mode="contained" onPress={goNext} style={styles.nextButton}>
            {currentIndex === slides.length - 1 ? 'Commencer' : 'Suivant'}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  slideTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  slideDesc: {
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextButton: {
    borderRadius: 12,
    marginLeft: 'auto',
    paddingHorizontal: 8,
  },
});
