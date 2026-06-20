import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from './api';

import firebase from '@react-native-firebase/app';
import messaging from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

if (Platform.OS !== 'web') {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[FCM Background Handler] Notificación recibida en segundo plano:', remoteMessage);
  });
}

export function usePushNotifications() {
  const navigation = useNavigation<any>();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    let isMounted = true;

    const requestAndRegisterToken = async () => {
      try {
        // Pedir permisos al sistema operativo
        const authStatus = await messaging().requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!isMounted) return;

        if (enabled) {
          try {
            // 🔥 Obtener el token de Firebase nativo
            const token = await messaging().getToken();
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

    const unsubscribeForeground = messaging().onMessage(async (remoteMessage) => {
      console.log('[FCM] 📲 Notificación recibida en primer plano:', remoteMessage);
      // Aquí puedes mostrar un diálogo o banner in-app si lo deseas
    });

    const unsubscribeNotificationOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('[FCM] 🔔 Notificación pulsada desde segundo plano:', remoteMessage.data);
      if (isMounted && remoteMessage.data) {
        handleNotificationNavigation(remoteMessage.data);
      }
    });

    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (isMounted && remoteMessage) {
          console.log('[FCM] 🚀 App abierta desde cero por notificación:', remoteMessage.data);
          if (remoteMessage.data) {
            handleNotificationNavigation(remoteMessage.data);
          }
        }
      })
      .catch((error) => {
        console.error('[FCM] ❌ Error en getInitialNotification:', error);
      });

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
