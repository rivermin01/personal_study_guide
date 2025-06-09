import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS } from '../constants/colors';
import HomeScreen from '../screens/Home/HomeScreen';
import StartTestScreen from '../screens/Home/StartTestScreen';
import RecordsScreen from '../screens/Records/RecordsScreen';
// import RecordDetailScreen from '../screens/Records/RecordDetailScreen'; // 상세 화면 제거
// import TimerRecordDetailScreen from '../screens/Records/TimerRecordDetailScreen'; // 상세 화면 제거
import TimerScreen from '../screens/Timer/TimerScreen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const RecordsStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
      }}
    >
      <Stack.Screen name="기록" component={RecordsScreen} />
      {/* <Stack.Screen name="RecordDetail" component={RecordDetailScreen} options={{ title: '검사 기록 상세' }} /> */}
      {/* <Stack.Screen name="TimerRecordDetail" component={TimerRecordDetailScreen} options={{ title: '타이머 기록 상세' }} /> */}
    </Stack.Navigator>
  );
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'help-circle-outline'; // 기본 아이콘 이름 설정

          if (route.name === '홈') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === '검사') {
            iconName = focused ? 'clipboard-text' : 'clipboard-text-outline';
          } else if (route.name === '기록') {
            iconName = focused ? 'history' : 'history';
          } else if (route.name === '타이머') {
            iconName = focused ? 'timer' : 'timer-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.point,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
        },
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
      })}
    >
      <Tab.Screen name="홈" component={HomeScreen} />
      <Tab.Screen name="검사" component={StartTestScreen} />
      <Tab.Screen name="기록" component={RecordsStack} options={{ headerShown: false }} />
      <Tab.Screen name="타이머" component={TimerScreen} />
    </Tab.Navigator>
  );
} 