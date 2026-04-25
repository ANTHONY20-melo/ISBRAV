// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'bolt.fill': 'flash-on',
  'shield.lefthalf.filled': 'admin-panel-settings',
  'chart.bar.fill': 'analytics',
  'calendar.badge.plus': 'event_available',
  'person.3.fill': 'group',
  'dollarsign.circle.fill': 'attach_money',
  'checkmark.circle.fill': 'check_circle',
  'questionmark.circle.fill': 'help-outline',
  'lock.fill': 'lock',
  'bubbles.and.sparkles.fill': 'auto-awesome',
  'info.circle.fill': 'info-outline',
  'pie.chart.fill': 'pie-chart',
  'eye.fill': 'visibility',
  'eye.slash.fill': 'visibility-off',
};

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] as ComponentProps<typeof MaterialIcons>['name']} style={style} />;
}
