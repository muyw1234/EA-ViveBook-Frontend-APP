import { Platform } from 'react-native';

let GoogleSigninModule: any = null;
try {
  if (Platform.OS !== 'web') {
    GoogleSigninModule = require('@react-native-google-signin/google-signin').GoogleSignin;
  }
} catch (error) {
  console.warn('⚠️ Google Sign-In no está disponible en Expo Go.');
}

export const configureGoogleSignIn = () => {
  if (Platform.OS === 'web' || !GoogleSigninModule) return;

  try {
    GoogleSigninModule.configure({
      webClientId: '820483348384-vlhf60gqdmvo8i9vgod8c3v16ebb4dbv.apps.googleusercontent.com',
      iosClientId: '820483348384-vlhf60gqdmvo8i9vgod8c3v16ebb4dbv.apps.googleusercontent.com',
    });
  } catch (err) {
    console.warn('⚠️ Error al configurar Google Sign-In:', err);
  }
};

export const loginWithGoogle = async () => {
  if (Platform.OS === 'web') {
    throw new Error('El inicio de sesión con Google solo está disponible en la app móvil.');
  }
  if (!GoogleSigninModule) {
    throw new Error('El inicio de sesión con Google no está disponible en este entorno (Expo Go).');
  }
  try {
    await GoogleSigninModule.hasPlayServices();
    const userInfo = await GoogleSigninModule.signIn();
    return userInfo;
  } catch (error) {
    throw error;
  }
};
