import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecordsScreen from '../screens/Records/RecordsScreen';

const Stack = createNativeStackNavigator();

export default function RecordsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="기록 목록" component={RecordsScreen} />
    </Stack.Navigator>
  );
} 