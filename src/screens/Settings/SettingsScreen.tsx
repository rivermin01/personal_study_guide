import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { COLORS } from '../../constants/colors';
import { signOut } from '../../utils/authService';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>설정</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>계정</Text>
        <TouchableOpacity style={[styles.menuItem, styles.lastItem]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>앱 정보</Text>
        <View style={[styles.menuItem, styles.lastItem]}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.text} />
          <Text style={styles.menuText}>버전 1.0.0</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 40,
    color: COLORS.text,
  },
  section: {
    marginBottom: 32,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: COLORS.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  menuText: {
    fontSize: 16,
    marginLeft: 12,
    color: COLORS.text,
  },
}); 