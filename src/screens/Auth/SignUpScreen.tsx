import React, { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { signUp } from '../../utils/authService';
import { useNavigation } from '@react-navigation/native';

interface PasswordRules {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordRules, setPasswordRules] = useState<PasswordRules>({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });
  const navigation = useNavigation();

  // 이메일 유효성 검사
  useEffect(() => {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (email && !emailRegex.test(email)) {
      setEmailError('올바른 이메일 형식이 아닙니다');
    } else {
      setEmailError(null);
    }
  }, [email]);

  // 비밀번호 규칙 검사
  useEffect(() => {
    setPasswordRules({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  const isPasswordValid = () => {
    return Object.values(passwordRules).every(rule => rule);
  };

  const isEmailValid = () => {
    return !emailError && email.length > 0;
  };

  const handleSignUp = async () => {
    setError(null);

    if (!email || !password || !confirmPassword) {
      setError('모든 필드를 입력해주세요.');
      return;
    }

    if (!isEmailValid()) {
      setError('올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (!isPasswordValid()) {
      setError('비밀번호가 모든 규칙을 만족하지 않습니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password);
      Alert.alert(
        '성공',
        '회원가입이 완료되었습니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ],
        { cancelable: false }
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const RuleCheck = ({ satisfied, text }: { satisfied: boolean; text: string }) => (
    <View style={styles.ruleContainer}>
      <Text style={[styles.ruleIcon, satisfied && styles.ruleSatisfied]}>
        {satisfied ? '✓' : '○'}
      </Text>
      <Text style={[styles.ruleText, satisfied && styles.ruleSatisfied]}>
        {text}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>회원가입</Text>
        <TextInput
          style={[styles.input, emailError && styles.inputError]}
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
        {emailError && (
          <Text style={styles.errorText}>{emailError}</Text>
        )}
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
        <View style={styles.rulesContainer}>
          <Text style={styles.rulesTitle}>비밀번호 규칙:</Text>
          <RuleCheck satisfied={passwordRules.length} text="8자 이상" />
          <RuleCheck satisfied={passwordRules.uppercase} text="대문자 포함" />
          <RuleCheck satisfied={passwordRules.lowercase} text="소문자 포함" />
          <RuleCheck satisfied={passwordRules.number} text="숫자 포함" />
          <RuleCheck satisfied={passwordRules.special} text="특수문자 포함" />
        </View>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            setError(null);
          }}
          secureTextEntry
          editable={!loading}
        />
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}
        <TouchableOpacity 
          style={[
            styles.button,
            loading && styles.buttonDisabled,
            (!isPasswordValid() || !isEmailValid()) && styles.buttonDisabled
          ]}
          onPress={handleSignUp}
          disabled={loading || !isPasswordValid() || !isEmailValid()}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>회원가입</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
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
  rulesContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.text,
  },
  ruleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  ruleIcon: {
    width: 20,
    fontSize: 14,
    color: '#adb5bd',
  },
  ruleText: {
    fontSize: 14,
    color: '#adb5bd',
    marginLeft: 8,
  },
  ruleSatisfied: {
    color: '#40c057',
  },
}); 