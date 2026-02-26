import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from 'react-native-paper';

interface SkeletonLoaderProps {
  count?: number;
}

export function SkeletonLoader({ count = 3 }: SkeletonLoaderProps) {
  const theme = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.item,
            {
              backgroundColor: theme.colors.surfaceVariant,
              opacity: pulseAnim,
            },
          ]}
        >
          <View style={[styles.titleBar, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={[styles.subtitleBar, { backgroundColor: theme.colors.outlineVariant }]} />
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 12,
  },
  item: {
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  titleBar: {
    height: 16,
    width: '60%',
    borderRadius: 4,
  },
  subtitleBar: {
    height: 12,
    width: '40%',
    borderRadius: 4,
  },
});
