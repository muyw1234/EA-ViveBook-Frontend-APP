import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { theme } from './styles/default';
import { createStaticNavigation, NavigationContainer } from '@react-navigation/native';
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
import { AccessibilityProvider } from './src/context/AccessibilityContext';
import style from './styles/default.old';

import {
  useFonts,
  Outfit_400Regular,
  Outfit_700Bold,
  Outfit_500Medium,
} from '@expo-google-fonts/outfit';

import MainNavigator from './src/navigation/MainNavigator';

const Stack = createNativeStackNavigator();

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.container}>
        <Text>Cargando fuentes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AccessibilityProvider>
        <PaperProvider theme={theme}>
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Home"
              screenOptions={{
                contentStyle: style.screen,
              }}
            >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen
                name="Main"
                component={MainNavigator}
                options={{ headerShown: false }}
              />
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
              <Stack.Screen
                name="Discover"
                component={DiscoverScreen}
                options={{ headerShown: false }}
              />
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
            </Stack.Navigator>
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
