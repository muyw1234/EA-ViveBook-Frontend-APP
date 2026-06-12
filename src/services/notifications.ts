import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import api from './api';

// Configura cómo debe comportarse la notificación cuando la app está abierta (primer plano)
Notifications.setNotificationHandler({
  handleNotification: async () =>
    ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }) as any,
});

export function usePushNotifications() {
  const navigation = useNavigation<any>();
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // 1. Obtener y registrar el token en el backend
    registerForPushNotificationsAsync().then(async (token) => {
      if (token) {
        try {
          await api.put('/usuarios/push-token', { expoPushToken: token });
          console.log('[Push] Token push registrado con éxito:', token);
        } catch (error) {
          console.warn('[Push] Error al registrar token push en backend:', error);
        }
      }
    });

    // 2. Listener para recibir notificaciones cuando la app está abierta
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('[Push] Notificación recibida en primer plano:', notification);
    });

    // 3. Listener para cuando el usuario pulsa (toca) la notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      console.log('[Push] Notificación pulsada con datos:', data);

      if (data && data.type) {
        handleNotificationNavigation(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const handleNotificationNavigation = (data: any) => {
    try {
      // Tipos: "event_joined", "new_rating", "book_favorite", "book_rented", "new_follower"
      switch (data.type) {
        case 'event_joined':
          if (data.eventId) {
            navigation.navigate('EventDetail', { eventId: data.eventId });
          }
          break;
        case 'new_rating':
          navigation.navigate('Profile');
          break;
        case 'book_favorite':
        case 'book_rented':
          navigation.navigate('MyBooks');
          break;
        case 'new_follower':
          if (data.actorId) {
            navigation.navigate('UserProfile', { userId: data.actorId });
          }
          break;
        case 'user_new_book':
          navigation.navigate('Discover');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('[Push] Error al realizar la navegación desde la notificación:', error);
    }
  };
}

async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Push] Permiso de notificaciones push denegado.');
      return undefined;
    }

    try {
      // Intentamos con projectId del EAS
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
    } catch (error) {
      console.warn(
        '[Push] Error al obtener Expo Push Token con projectId, usando fallback sin parámetros:',
        error,
      );
      try {
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } catch (fallbackError) {
        console.error('[Push] Error absoluto al obtener el token push de Expo:', fallbackError);
      }
    }
  } else {
    console.log(
      '[Push] Se requiere un dispositivo físico para recibir notificaciones push en desarrollo.',
    );
  }

  return token;
}
