import { MD3LightTheme as DefaultTheme, configureFonts } from 'react-native-paper';
import { StyleSheet, Platform } from 'react-native';

const fontConfig = {
  displayLarge: { fontFamily: 'Outfit_700Bold' },
  displayMedium: { fontFamily: 'Outfit_700Bold' },
  displaySmall: { fontFamily: 'Outfit_700Bold' },
  headlineLarge: { fontFamily: 'Outfit_700Bold' },
  headlineMedium: { fontFamily: 'Outfit_700Bold' },
  headlineSmall: { fontFamily: 'Outfit_700Bold' },
  titleLarge: { fontFamily: 'Outfit_500Medium' },
  titleMedium: { fontFamily: 'Outfit_500Medium' },
  titleSmall: { fontFamily: 'Outfit_500Medium' },
  labelLarge: { fontFamily: 'Outfit_500Medium' },
  labelMedium: { fontFamily: 'Outfit_500Medium' },
  labelSmall: { fontFamily: 'Outfit_500Medium' },
  bodyLarge: { fontFamily: 'Outfit_400Regular' },
  bodyMedium: { fontFamily: 'Outfit_400Regular' },
  bodySmall: { fontFamily: 'Outfit_400Regular' },
};

export const theme = {
  ...DefaultTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...DefaultTheme.colors,
    primary: '#D6AED2',
    secondary: '#4f46e5',
    background: '#F5EBF4',
    surface: '#ffffff',
    error: '#ef4444',
    outline: '#e2e8f0',
  },
  roundness: 12,
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EBF4',
  },
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    color: '#1e1b4b',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F5EBF4',
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
});
