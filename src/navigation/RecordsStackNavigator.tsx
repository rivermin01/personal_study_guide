import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RecordsScreen from '../screens/Records/RecordsScreen';
// import RecordDetailScreen from '../screens/Records/RecordDetailScreen'; // 삭제된 파일 참조 제거

const Stack = createNativeStackNavigator();

export default function RecordsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="기록 목록" component={RecordsScreen} />
      {/* <Stack.Screen name="기록 상세" component={RecordDetailScreen} /> */}
    </Stack.Navigator>
  );
} 