import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Text, TextInput, IconButton, useTheme } from 'react-native-paper';
import { Swipeable } from 'react-native-gesture-handler';
import { useTranslation } from '../../i18n/useTranslation';

const SPACING = { xs: 4, sm: 8, md: 12, xxl: 32 };
const RADIUS = 12;

interface HistoryListProps<T extends { id: string; createdAt: number }> {
  entries: T[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onPress: (entry: T) => void;
  renderContent: (entry: T) => React.ReactNode;
  searchFilter?: (entry: T, query: string) => boolean;
  title: string;
  searchPlaceholder?: string;
}

export function HistoryList<T extends { id: string; createdAt: number }>({
  entries,
  onRemove,
  onClear,
  onPress,
  renderContent,
  searchFilter,
  title,
  searchPlaceholder,
}: HistoryListProps<T>) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const fadeAnims = useRef<Record<string, Animated.Value>>({});

  const getFadeAnim = useCallback((id: string) => {
    if (!fadeAnims.current[id]) {
      fadeAnims.current[id] = new Animated.Value(1);
    }
    return fadeAnims.current[id];
  }, []);

  const prevLengthRef = useRef(entries.length);
  if (entries.length === 0 && prevLengthRef.current > 0) {
    fadeAnims.current = {};
  }
  prevLengthRef.current = entries.length;

  const formatRelativeTime = useCallback(
    (timestamp: number): string => {
      const diff = Math.floor((Date.now() - timestamp) / 1000);
      if (diff < 60) return t('common.justNow');
      if (diff < 3600) return t('common.minutesAgo', { count: Math.floor(diff / 60) });
      if (diff < 86400) return t('common.hoursAgo', { count: Math.floor(diff / 3600) });
      return t('common.daysAgo', { count: Math.floor(diff / 86400) });
    },
    [t],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const anim = getFadeAnim(id);
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        onRemove(id);
        delete fadeAnims.current[id];
      });
    },
    [onRemove, getFadeAnim],
  );

  const filtered = useMemo(() => entries.filter((entry) => {
    if (!search.trim() || !searchFilter) return true;
    return searchFilter(entry, search.trim().toLowerCase());
  }), [entries, search, searchFilter]);

  if (entries.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.onSurface }]}>{title}</Text>
        <IconButton icon="delete-outline" size={20} onPress={onClear} iconColor={theme.colors.error} />
      </View>

      {entries.length > 3 && searchFilter && (
        <TextInput
          placeholder={searchPlaceholder}
          value={search}
          onChangeText={setSearch}
          mode="outlined"
          dense
          left={<TextInput.Icon icon="magnify" size={18} />}
          right={search ? <TextInput.Icon icon="close" size={18} onPress={() => setSearch('')} /> : undefined}
          style={[styles.searchInput, { backgroundColor: theme.colors.surface }]}
          outlineColor={theme.colors.outlineVariant}
          activeOutlineColor={theme.colors.primary}
          outlineStyle={{ borderRadius: RADIUS }}
        />
      )}

      {filtered.map((entry) => (
        <Animated.View key={entry.id} style={{ opacity: getFadeAnim(entry.id) }}>
          <Swipeable
            renderRightActions={() => (
              <Pressable
                onPress={() => handleRemove(entry.id)}
                style={[styles.swipeDelete, { backgroundColor: theme.colors.error }]}
              >
                <IconButton icon="delete" iconColor="#fff" size={20} />
              </Pressable>
            )}
            overshootRight={false}
          >
            <Pressable
              onPress={() => onPress(entry)}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant },
                pressed && { backgroundColor: theme.colors.surfaceVariant },
              ]}
            >
              <View style={styles.row}>
                <View style={styles.content}>{renderContent(entry)}</View>
                <Text style={[styles.time, { color: theme.colors.onSurfaceVariant }]}>
                  {formatRelativeTime(entry.createdAt)}
                </Text>
                <IconButton
                  icon="delete-outline"
                  size={18}
                  onPress={() => handleRemove(entry.id)}
                  iconColor={theme.colors.onSurfaceVariant}
                  style={styles.deleteIcon}
                />
              </View>
            </Pressable>
          </Swipeable>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  title: { fontSize: 16, fontWeight: '600' },
  searchInput: { marginBottom: SPACING.md, fontSize: 14 },
  swipeDelete: { justifyContent: 'center', alignItems: 'center', width: 56, borderRadius: RADIUS, marginBottom: SPACING.sm },
  item: { borderRadius: RADIUS, borderWidth: 1, padding: SPACING.md, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', alignItems: 'center' },
  content: { flex: 1 },
  time: { fontSize: 12, marginRight: SPACING.xs },
  deleteIcon: { margin: 0 },
});
