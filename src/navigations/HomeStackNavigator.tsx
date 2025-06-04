import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Home/HomeScreen';
import StartTestScreen from '../screens/Home/StartTestScreen';
import ResultScreen from '../screens/Result/ResultScreen';

const Stack = createNativeStackNavigator();

export default function HomeStack() {
  return (
    <Stack.Navigator>
        <Stack.Screen name="홈" component={HomeScreen} />
        <Stack.Screen name="검사 시작" component={StartTestScreen} />
        <Stack.Screen name="결과" component={ResultScreen} />
    </Stack.Navigator>
  );
}