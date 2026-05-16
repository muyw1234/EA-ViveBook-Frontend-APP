import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@react-native-vector-icons/ionicons';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import MyBooksScreen from '../screens/MyBooksScreen';
import style from '../../styles/default.old';
import { useTranslation } from 'react-i18next';

const Tab = createBottomTabNavigator();

export default function MainNavigator() {
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
        name="MyBooks" 
        component={MyBooksScreen} 
        options={{
          title: t('my_books'),
          tabBarIcon: ({ size }) => <Text style={{ fontSize: size }}>📚</Text>
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
