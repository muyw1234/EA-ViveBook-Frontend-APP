import { Platform } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web') return;
  GoogleSignin.configure({
    webClientId: '820483348384-vlhf60gqdmvo8i9vgod8c3v16ebb4dbv.apps.googleusercontent.com',
    iosClientId: '820483348384-vlhf60gqdmvo8i9vgod8c3v16ebb4dbv.apps.googleusercontent.com',
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
