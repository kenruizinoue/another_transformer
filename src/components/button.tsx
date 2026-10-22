import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Accent, AccentTint, OnAccent, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'dangerTinted';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  /** primary and danger are filled; secondary is gray; dangerTinted is a soft red. */
  variant?: ButtonVariant;
  icon?: IconName;
  size?: 'regular' | 'large';
  disabled?: boolean;
  testID?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * The app's pill button. All button chrome lives here so screens never define
 * their own Pressable styling or accent colors. It sets no alignment of its
 * own: a centered parent centers it, a stretching parent makes it full width.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  size = 'regular',
  disabled = false,
  testID,
  style,
}: ButtonProps) {
  const theme = useTheme();
  const colors = {
    primary: { background: Accent.primary, label: OnAccent },
    secondary: { background: theme.backgroundElement, label: theme.text },
    danger: { background: Accent.danger, label: OnAccent },
    dangerTinted: { background: AccentTint.danger, label: Accent.danger },
  }[variant];
  const large = size === 'large';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        large && styles.large,
        { backgroundColor: colors.background },
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {icon && <Icon name={icon} size={large ? 20 : 17} color={colors.label} />}
      <ThemedText
        type="default"
        numberOfLines={1}
        style={[styles.label, large && styles.labelLarge, { color: colors.label }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: Spacing.four - Spacing.one,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  large: {
    minHeight: 56,
    paddingHorizontal: Spacing.five,
  },
  label: {
    fontWeight: '600',
  },
  labelLarge: {
    fontSize: 17,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.4,
  },
});
