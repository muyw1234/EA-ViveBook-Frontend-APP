import React, { useState, useEffect } from 'react';
import { Text, View, DeviceEventEmitter } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ProfileScreen from '../screens/ProfileScreen';
import DashboardScreen from '../screens/DashboardScreen';
import BuzonScreen from '../screens/BuzonScreen';
import MyBooksScreen from '../screens/MyBooksScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
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

export default function MainNavigator() {
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
        name="MyBooks"
        component={MyBooksScreen}
        options={{
          title: t('my_books'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>📚</Text>
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
        name="Buzon"
        component={BuzonScreen}
        options={{
          title: 'Chats',
          tabBarIcon: ({ size }) => <ChatTabIcon size={size} hasUnread={hasUnread} />
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
    </Tab.Navigator>
  );
}
