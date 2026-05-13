import React from 'react';
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
        headerStyle: { backgroundColor: '#F5E4F0' },
        sceneStyle: style.screen
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          title: t('dash_header'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="MyBooks" 
        component={MyBooksScreen} 
        options={{
          title: t('my_books'),
          tabBarIcon: ({ color, size }) => <Ionicons name="book" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Chat" 
        component={ChatRoomScreen} 
        initialParams={{ chatId: '000000000000000000000001' }}
        options={{
          title: 'Chat Global',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          title: t('profile_title'),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />
        }} 
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{
          title: t('accessibility_settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />
        }} 
      />
    </Tab.Navigator>
  );
}
