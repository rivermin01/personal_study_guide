import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import TabNavigator from './navigation/TabNavigator';
import AuthNavigator from './navigation/AuthNavigator';
import { onAuthChange, signOut } from './utils/authService';
import { testFirebaseConnection } from './utils/firebaseTest';
import { COLORS } from './constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './config/firebase';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const keepLoggedIn = await AsyncStorage.getItem('keepLoggedIn');
        
        // 로그인 유지가 설정되어 있지 않으면 로그아웃
        if (!keepLoggedIn) {
          await signOut().catch(error => {
            console.error('로그아웃 실패:', error);
          });
        }
      } catch (error) {
        console.error('로그인 상태 확인 실패:', error);
      }
    };

    // 앱 시작 시 로그인 상태 확인
    checkLoginStatus();

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
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (isLoading || isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.point} />
      </View>
    );
  }

  return !isLoggedIn ? <AuthNavigator /> : <TabNavigator />;
} 