import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const customColors = {
  primary: '#FF6B35',
  primaryContainer: '#FFE0D0',
  secondary: '#FF8F65',
  secondaryContainer: '#FFF0E8',
  tertiary: '#6B4226',
  tertiaryContainer: '#FFDCC8',
  surface: '#FFFFFF',
  surfaceVariant: '#F3F4F6',
  background: '#FAFAFA',
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#3B1300',
  onSecondary: '#FFFFFF',
  onSecondaryContainer: '#3B1300',
  onTertiary: '#FFFFFF',
  onTertiaryContainer: '#2B1700',
  onSurface: '#1C1B1F',
  onSurfaceVariant: '#49454F',
  onBackground: '#1C1B1F',
  onError: '#FFFFFF',
  onErrorContainer: '#410002',
  outline: '#CAC4D0',
  outlineVariant: '#E7E0EC',
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FFB59A',
    primaryContainer: '#8B3A14',
    secondary: '#FFB59A',
    secondaryContainer: '#6B3A1E',
    tertiary: '#FFB88C',
    tertiaryContainer: '#5A3420',
    surface: '#1C1B1F',
    surfaceVariant: '#2C2C2C',
    background: '#1C1B1F',
    onPrimary: '#5A2800',
    onPrimaryContainer: '#FFE0D0',
    onSecondary: '#5A2800',
    onSecondaryContainer: '#FFE0D0',
    onTertiary: '#3E2010',
    onTertiaryContainer: '#FFDCC8',
    onSurface: '#E6E1E5',
    onSurfaceVariant: '#CAC4D0',
    onBackground: '#E6E1E5',
    outline: '#938F99',
    outlineVariant: '#49454F',
  },
};
