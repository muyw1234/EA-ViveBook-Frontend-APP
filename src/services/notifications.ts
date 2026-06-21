import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from './api';

if (Platform.OS !== 'web') {
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('⚠️ expo-notifications no está disponible en este entorno (ej. Expo Go):', error);
  }
}

let messagingModule: any = null;

if (Platform.OS !== 'web') {
  try {
    // Intentamos cargar de forma dinámica las dependencias nativas de Firebase
    messagingModule = require('@react-native-firebase/messaging');
    require('@react-native-firebase/app');
  } catch (error) {
    console.warn(
      '⚠️ Firebase Nativo no está disponible. Las notificaciones push nativas no funcionarán en Expo Go.',
    );
  }
}

const getMessaging = () => {
  if (Platform.OS === 'web' || !messagingModule) {
    return null;
  }
  try {
    return messagingModule.default || messagingModule;
  } catch (e) {
    return null;
  }
};

const AuthorizationStatus = (messagingModule?.default || messagingModule)?.AuthorizationStatus || {
  NOT_DETERMINED: -1,
  DENIED: 0,
  AUTHORIZED: 1,
  PROVISIONAL: 2,
};

if (Platform.OS !== 'web' && getMessaging()) {
  try {
    getMessaging()().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log(
        '[FCM Background Handler] Notificación recibida en segundo plano:',
        remoteMessage,
      );
    });
  } catch (error) {
    console.warn('⚠️ No se pudo registrar el background message handler:', error);
  }
}

export function usePushNotifications() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const messagingInstance = getMessaging();
    if (!messagingInstance) {
      console.log('[FCM] Saltando registro de notificaciones nativas en Expo Go.');
      return;
    }

    let isMounted = true;

    const requestAndRegisterToken = async () => {
      try {
        const fcm = messagingInstance();
        // Pedir permisos al sistema operativo
        const authStatus = await fcm.requestPermission();
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED ||
          authStatus === AuthorizationStatus.PROVISIONAL;

        if (!isMounted) return;

        if (enabled) {
          try {
            // 🔥 Obtener el token de Firebase nativo
            const token = await fcm.getToken();
            if (token) {
              await api.post('/auth/update-fcm-token', { fcmToken: token });
              console.log('[FCM] ✅ Token nativo registrado con éxito en tu Backend:', token);
            }
          } catch (error) {
            console.warn('[FCM] ⚠️ Error al obtener/registrar el token:', error);
          }
        } else {
          console.warn('[FCM] ⚠️ Permisos de notificaciones no autorizados');
        }
      } catch (error) {
        console.error('[FCM] ❌ Error en requestAndRegisterToken:', error);
      }
    };

    requestAndRegisterToken();

    let unsubscribeForeground: () => void = () => {};
    let unsubscribeNotificationOpened: () => void = () => {};

    try {
      const fcm = messagingInstance();
      unsubscribeForeground = fcm.onMessage(async (remoteMessage: any) => {
        console.log('[FCM] 📲 Notificación recibida en primer plano:', remoteMessage);
      });

      unsubscribeNotificationOpened = fcm.onNotificationOpenedApp((remoteMessage: any) => {
        console.log('[FCM] 🔔 Notificación pulsada desde segundo plano:', remoteMessage.data);
        if (isMounted && remoteMessage.data) {
          handleNotificationNavigation(remoteMessage.data);
        }
      });

      fcm
        .getInitialNotification()
        .then((remoteMessage: any) => {
          if (isMounted && remoteMessage) {
            console.log('[FCM] 🚀 App abierta desde cero por notificación:', remoteMessage.data);
            if (remoteMessage.data) {
              handleNotificationNavigation(remoteMessage.data);
            }
          }
        })
        .catch((error: any) => {
          console.error('[FCM] ❌ Error en getInitialNotification:', error);
        });
    } catch (err) {
      console.warn('[FCM] Error al inicializar escuchas de notificaciones:', err);
    }

    return () => {
      isMounted = false;
      unsubscribeForeground();
      unsubscribeNotificationOpened();
    };
  }, []);

  const handleNotificationNavigation = (data: any) => {
    try {
      console.log('[FCM] 🧭 Navegando con data:', data);
      if (!navigation) {
        console.warn('[FCM] ⚠️ Navigation no está disponible aún');
        return;
      }

      switch (data.type) {
        case 'event_joined':
          if (data.eventId) {
            navigation.navigate('EventDetail', { eventId: data.eventId });
            console.log('[FCM] ✅ Navegó a EventDetail');
          }
          break;
        case 'new_rating':
          navigation.navigate('Profile');
          console.log('[FCM] ✅ Navegó a Profile');
          break;
        case 'book_favorite':
        case 'book_rented':
          navigation.navigate('MyBooks');
          console.log('[FCM] ✅ Navegó a MyBooks');
          break;
        case 'new_follower':
          if (data.actorId) {
            navigation.navigate('UserProfile', { userId: data.actorId });
            console.log('[FCM] ✅ Navegó a UserProfile');
          }
          break;
        case 'user_new_book':
          navigation.navigate('Discover');
          console.log('[FCM] ✅ Navegó a Discover');
          break;
        default:
          console.warn('[FCM] ⚠️ Tipo de notificación no manejado:', data.type);
          break;
      }
    } catch (error) {
      console.error('[FCM] ❌ Error al navegar:', error);
    }
  };
}
