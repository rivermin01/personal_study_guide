import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';

import HomeStack from './HomeStackNavigator';
import RecordsStack from './RecordsStackNavigator';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import TimerScreen from '../screens/Timer/TimerScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: COLORS.point,
          tabBarInactiveTintColor: '#adb5bd',
          tabBarStyle: {
            backgroundColor: '#fff',
          },
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="홈" 
          component={HomeStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="타이머"
          component={TimerScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="timer-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="기록" 
          component={RecordsStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="list-outline" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="설정" 
          component={SettingsScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}