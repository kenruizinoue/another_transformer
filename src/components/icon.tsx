import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

export type IconName = Extract<SymbolViewProps['name'], string>;

/** An SF Symbol tinted to a color. Decorative: screen readers skip it. */
export function Icon({
  name,
  size = 20,
  color,
  weight = 'semibold',
}: {
  name: IconName;
  size?: number;
  color: ColorValue;
  weight?: Extract<SymbolViewProps['weight'], string>;
}) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
      weight={weight}
      resizeMode="scaleAspectFit"
      style={{ width: size, height: size }}
      accessible={false}
    />
  );
}
