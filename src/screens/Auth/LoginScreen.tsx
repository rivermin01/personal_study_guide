import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { signIn } from '../../utils/authService';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const navigation = useNavigation<any>();

  const handleLogin = async () => {
    setError(null);

    if (!email || !password) {
      setError('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      const user = await signIn(email, password);
      
      // 로그인 유지 설정 저장
      if (keepLoggedIn) {
        await AsyncStorage.setItem('keepLoggedIn', 'true');
      } else {
        await AsyncStorage.removeItem('keepLoggedIn');
      }
      
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const goToSignUp = () => {
    navigation.navigate('회원가입');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>로그인</Text>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="이메일"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError(null);
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="비밀번호"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setError(null);
          }}
          secureTextEntry
          editable={!loading}
        />
        <TouchableOpacity 
          style={styles.keepLoginContainer}
          onPress={() => setKeepLoggedIn(!keepLoggedIn)}
        >
          <Ionicons 
            name={keepLoggedIn ? "checkbox" : "square-outline"} 
            size={24} 
            color={COLORS.point}
          />
          <Text style={styles.keepLoginText}>로그인 유지</Text>
        </TouchableOpacity>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>로그인</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.signUpButton}
          onPress={goToSignUp}
          disabled={loading}
        >
          <Text style={styles.signUpText}>계정이 없으신가요? 회원가입</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    color: COLORS.text,
  },
  input: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: COLORS.point,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signUpButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  signUpText: {
    color: COLORS.point,
    fontSize: 14,
  },
  keepLoginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  keepLoginText: {
    marginLeft: 8,
    fontSize: 14,
    color: COLORS.text,
  },
}); 