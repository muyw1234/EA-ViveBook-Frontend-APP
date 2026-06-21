import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { theme } from './styles/default';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BooksForSaleScreen from './src/screens/BooksForSaleScreen';
import BooksForRentScreen from './src/screens/BooksForRentScreen';
import AddBookScreen from './src/screens/AddBookScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SearchScreen from './src/screens/SearchScreen';
import DiscoverScreen from './src/screens/DiscoverScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import RetosScreen from './src/screens/RetosScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';
import FavoritesScreen from './src/screens/FavoritesScreen';
import ExploreEventsScreen from './src/screens/ExploreEventsScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import style from './styles/default.old';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { restoreSession, SessionEntryRoute, subscribeToSession } from './src/services/session';
import api from './src/services/api';
import { unwrapApiData } from './src/utils/apiResponse';
import './src/config/firebase';
import { usePushNotifications } from './src/services/notifications';

import {
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_500Medium,
} from '@expo-google-fonts/outfit';

import MainNavigator from './src/navigation/MainNavigator';

const Stack = createNativeStackNavigator();

import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

// 🔥 Inicializar el handler de mensajes en segundo plano de forma segura
if (Platform.OS !== 'web') {
  try {
    const messaging =
      require('@react-native-firebase/messaging').default ||
      require('@react-native-firebase/messaging');
    messaging()
      .getInitialNotification()
      .then((remoteMessage: any) => {
        if (remoteMessage) {
          console.log('[FCM] App inicializada con notificación:', remoteMessage);
        }
      })
      .catch((error: any) => {
        console.error('[FCM] Error inicializando FCM:', error);
      });
  } catch (error) {
    console.warn('⚠️ Firebase Messaging no está disponible en este entorno (Expo Go).');
  }
}

function NavigationWatcher({ sessionStatus, entryRoute, guestRoute }: any) {
  // Aquí se ejecuta el hook. Al estar dentro de NavigationContainer,
  //useNavigation() funcionará perfectamente sin dar errores de contexto.
  usePushNotifications();

  return (
    <Stack.Navigator
      key={sessionStatus}
      initialRouteName={sessionStatus === 'authenticated' ? entryRoute : guestRoute}
      screenOptions={{
        contentStyle: style.screen,
      }}
    >
      {sessionStatus === 'guest' ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : (
        <>
          {entryRoute === 'Onboarding' && (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          )}
          {entryRoute === 'Discover' && (
            <Stack.Screen
              name="Discover"
              component={DiscoverScreen}
              options={{ headerShown: false }}
            />
          )}
          <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
          <Stack.Screen
            name="BooksForSale"
            component={BooksForSaleScreen}
            options={{ title: 'Libros en Venta' }}
          />
          <Stack.Screen
            name="BooksForRent"
            component={BooksForRentScreen}
            options={{ title: 'Libros en Alquiler' }}
          />
          <Stack.Screen
            name="AddBook"
            component={AddBookScreen}
            options={{ title: 'Subir Libro' }}
          />
          <Stack.Screen
            name="UserProfile"
            component={ProfileScreen}
            options={{ title: 'Perfil de Usuario', presentation: 'modal' }}
          />
          <Stack.Screen
            name="Search"
            component={SearchScreen}
            options={{ title: 'Búsqueda de Libros' }}
          />
          <Stack.Screen
            name="EventDetail"
            component={EventDetailScreen}
            options={{ title: 'Detalle de Evento' }}
          />
          {entryRoute !== 'Onboarding' && (
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          )}
          {entryRoute !== 'Discover' && (
            <Stack.Screen
              name="Discover"
              component={DiscoverScreen}
              options={{ headerShown: false }}
            />
          )}
          <Stack.Screen name="Retos" component={RetosScreen} options={{ title: 'Mis Retos' }} />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Ajustes de accesibilidad' }}
          />
          <Stack.Screen
            name="ChatRoom"
            component={ChatRoomScreen}
            options={{ title: 'Chat Privado' }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ title: 'Mis Favoritos' }}
          />
          <Stack.Screen
            name="ExploreEvents"
            component={ExploreEventsScreen}
            options={{ title: 'Explorar Eventos' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [sessionStatus, setSessionStatus] = useState<'loading' | 'authenticated' | 'guest'>(
    'loading',
  );
  const [entryRoute, setEntryRoute] = useState<SessionEntryRoute>('Main');
  const [guestRoute, setGuestRoute] = useState<'Home' | 'Login'>('Home');
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToSession((change) => {
      if (!mounted) return;

      if (change.authenticated) {
        setEntryRoute(change.entryRoute);
        setSessionStatus('authenticated');
      } else {
        setGuestRoute('Login');
        setSessionStatus('guest');
      }
    });

    restoreSession()
      .then(async (session) => {
        if (!mounted) return;

        if (session) {
          let latestUser = session.user;
          try {
            const response = await api.get('/auth/profile');
            const unwrapped = unwrapApiData<any>(response.data);
            if (unwrapped) {
              latestUser = unwrapped;
              await AsyncStorage.setItem('user', JSON.stringify(unwrapped));
            }
          } catch {
            // A 401/403 is handled by the interceptor. Temporary network or
            // server errors do not discard an otherwise valid local session.
          }

          const determinedRoute: SessionEntryRoute =
            latestUser.hasSeenTutorial !== true ? 'Onboarding' : 'Main';
          setEntryRoute(determinedRoute);
          setSessionStatus('authenticated');
        } else {
          setGuestRoute('Login');
          setSessionStatus('guest');
        }
      })
      .catch(() => {
        if (!mounted) return;
        setGuestRoute('Login');
        setSessionStatus('guest');
      });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  if (!fontsLoaded || sessionStatus === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#D183BA" />
        <Text>Restaurando sesión...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AccessibilityProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <NavigationWatcher
              sessionStatus={sessionStatus}
              entryRoute={entryRoute}
              guestRoute={guestRoute}
            />
          </NavigationContainer>
        </PaperProvider>
      </AccessibilityProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
