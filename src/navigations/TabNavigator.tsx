import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../screens/Home/HomeScreen';
//import RecordsStack from './RecordsStackNavigator';
//import SettingsScreen from '../screens/Settings/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="홈" component={HomeScreen} />
        {/*
        <Tab.Screen name="기록" component={RecordsStack} />
        <Tab.Screen name="설정" component={SettingsScreen} />
        */}
      </Tab.Navigator>
    </NavigationContainer>
  );
}