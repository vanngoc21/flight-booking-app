/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#123B5D',
    background: '#F7F9FC',
    backgroundElement: '#EDF4F9',
    backgroundSelected: '#DCEAF4',
    textSecondary: '#687F91',
  },
  dark: {
    text: '#F4F8FB',
    background: '#102B42',
    backgroundElement: '#193B55',
    backgroundSelected: '#244D68',
    textSecondary: '#B6C5D0',
  },
} as const;

export const PremiumPalette = {
  navy: '#123B5D',
  sky: '#2878B9',
  cloud: '#EAF4FC',
  gold: '#E8C27A',
  surface: '#FFFFFF',
  canvas: '#F7F9FC',
  border: '#E1EAF1',
  muted: '#687F91',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
