import React, { useState, useEffect } from 'react';
import { Text, View, DeviceEventEmitter } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import DashboardScreen from '../screens/DashboardScreen';
import MyBooksScreen from '../screens/MyBooksScreen';
import BuzonScreen from '../screens/BuzonScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import CreateEventScreen from '../screens/CreateEventScreen';
import AddBookScreen from '../screens/AddBookScreen';
import style from '../../styles/default.old';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import socket from '../services/socket';

const Tab = createBottomTabNavigator();

function ChatTabIcon({ size, hasUnread }: { size: number; hasUnread: boolean }) {
  return (
    <View>
      <Text style={{ fontSize: size }}>💬</Text>
      {hasUnread && (
        <View
          style={{
            position: 'absolute',
            top: -2,
            right: -4,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: '#ef4444',
            borderWidth: 1.5,
            borderColor: '#fff',
          }}
        />
      )}
    </View>
  );
}
const Stack = createNativeStackNavigator();

// 1. Contenedor de las pestañas inferiores fijas
function BottomTabs() {
  const { t } = useTranslation();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    checkUnread();
    const interval = setInterval(checkUnread, 30000);

    const subscription = DeviceEventEmitter.addListener('unread_change', checkUnread);

    if (!socket.connected) {
      socket.connect();
    }
    const handleSocketMessage = () => {
      checkUnread();
    };
    socket.on('receive_message', handleSocketMessage);

    return () => {
      clearInterval(interval);
      subscription.remove();
      socket.off('receive_message', handleSocketMessage);
    };
  }, []);

  const checkUnread = async () => {
    try {
      const response = await api.get('/mensajes/unread-count');
      const data = response.data?.data || response.data || {};
      setHasUnread(data.total > 0);
    } catch {
      // fallo silencioso
    }
  };

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: '#000080',
        headerStyle: { backgroundColor: '#D6AED2' },
        sceneStyle: style.screen,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t('dash_header'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🏠</Text>,
        }}
      />
      <Tab.Screen
        name="MyBooks"
        component={MyBooksScreen}
        options={{
          title: t('my_books'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          title: t('discover_title', { defaultValue: 'Descubrir' }),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>🧭</Text>,
        }}
      />
      <Tab.Screen
        name="Buzon"
        component={BuzonScreen}
        options={{
          title: 'Chats',
          tabBarIcon: ({ size }) => <ChatTabIcon size={size} hasUnread={hasUnread} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('profile_title'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>👤</Text>,
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
