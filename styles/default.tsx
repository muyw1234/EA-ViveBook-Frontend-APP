import { MD3LightTheme as DefaultTheme } from 'react-native-paper';
import { StyleSheet } from 'react-native';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#7c3aed',
    secondary: '#4f46e5',
    background: '#f8fafc',
    surface: '#ffffff',
    error: '#ef4444',
    outline: '#e2e8f0',
  },
  roundness: 12,
};

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  card: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: '#1e1b4b',
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#f8fafc',
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
  }
});