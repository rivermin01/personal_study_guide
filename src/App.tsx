import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import TabNavigator from './navigations/TabNavigator';
import AuthNavigator from './navigations/AuthNavigator';
import { onAuthChange, signOut } from './utils/authService';
import { testFirebaseConnection } from './utils/firebaseTest';
import { COLORS } from './constants/colors';
import './config/firebase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // 앱 시작 시 로그아웃
    signOut().catch(error => {
      console.error('로그아웃 실패:', error);
    });

    // Firebase 연결 테스트
    testFirebaseConnection()
      .then(result => {
        console.log('Firebase 연결 테스트 결과:', result);
      })
      .catch(error => {
        console.error('Firebase 연결 테스트 실패:', error);
      });

    const unsubscribe = onAuthChange((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.point} />
      </View>
    );
  }

  return !isLoggedIn ? <AuthNavigator /> : <TabNavigator />;
} 