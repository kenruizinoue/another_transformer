import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Spacing } from '@/constants/theme';

/**
 * Transient, non-blocking feedback toast pinned above the tab bar. Renders
 * nothing without a message and auto-dismisses after durationMs.
 */
export function Snackbar({
  message,
  onDismiss,
  durationMs = 3500,
}: {
  message: string | null;
  onDismiss: () => void;
  durationMs?: number;
}) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(id);
  }, [durationMs, message, onDismiss]);

  if (!message) return null;

  return (
    <View
      pointerEvents="none"
      testID="snackbar"
      style={[styles.wrap, { bottom: insets.bottom + BottomTabInset + Spacing.four }]}>
      <View style={styles.toast}>
        <ThemedText type="small" style={styles.text}>
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.four,
    right: Spacing.four,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#2b2b2ef2',
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    maxWidth: 460,
  },
  text: {
    color: '#f5f5f7',
    textAlign: 'center',
  },
});
