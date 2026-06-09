import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack'; 
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CreateEventScreen from '../screens/CreateEventScreen'; 
import AddBookScreen from '../screens/AddBookScreen'; 
import style from '../../styles/default.old';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator(); 

// 1. Contenedor de las pestañas inferiores fijas
function BottomTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: "#000080",
        headerStyle: { backgroundColor: '#D6AED2' },
        sceneStyle: style.screen
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          title: t('dash_header'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🏠</Text>
        }} 
      />
      <Tab.Screen 
        name="Discover" 
        component={DiscoverScreen} 
        options={{
          title: t('discover_title', { defaultValue: 'Descubrir' }),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🧭</Text>
        }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatRoomScreen} 
        initialParams={{ chatId: '000000000000000000000001' }}
        options={{
          title: 'Chat Global',
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>💬</Text>
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: t('profile_title'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>👤</Text>
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          title: t('accessibility_settings'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>⚙️</Text>
        }} 
      />
    </Tab.Navigator>
  );
}

// 2. El enrutador principal que maneja los saltos a pantallas completas
export default function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tu vista con el menú inferior */}
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      
      {/* Pantalla para Crear Eventos */}
      <Stack.Screen 
        name="CreateEventScreen" 
        component={CreateEventScreen} 
        options={{ headerShown: true, title: 'Crear Nuevo Evento' }} 
      />

      {/* Pantalla para Añadir Libros formalizada en este Stack */}
      <Stack.Screen 
        name="AddBook" 
        component={AddBookScreen} 
        options={{ headerShown: true, title: 'Añadir Nuevo Libro' }} 
      />
    </Stack.Navigator>
  );
}