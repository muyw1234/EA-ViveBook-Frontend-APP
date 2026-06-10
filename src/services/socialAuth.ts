import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web') return;
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
  });
};

export const loginWithGoogle = async () => {
  if (Platform.OS === 'web') {
    throw new Error('El inicio de sesión con Google solo está disponible en la app móvil.');
  }
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    return userInfo;
  } catch (error) {
    throw error;
  }
};

export const isAppleLoginAvailable = async () => {
  if (Platform.OS === 'web') return false;
  return await AppleAuthentication.isAvailableAsync();
};

export const loginWithApple = async () => {
  if (Platform.OS === 'web') {
    throw new Error('El inicio de sesión con Apple no está disponible en web.');
  }
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    return credential;
  } catch (error) {
    throw error;
  }
};
