import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TestResult } from '../../types/result';

type RouteParams = {
  result: TestResult;
};

export default function RecordDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { result } = route.params;

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>검사 결과</Text>
        <View style={styles.placeholder} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.date}>{formatDate(result.timestamp)}</Text>
        <Text style={styles.title}>{result.personalityType}</Text>
        <Text style={styles.recommend}>{result.recommendation}</Text>
        
        <Text style={styles.subtitle}>검사 결과 요약</Text>
        <View style={styles.scoreContainer}>
          <ScoreItem label="외향성" score={result.scores.extraversion} />
          <ScoreItem label="개방성" score={result.scores.openness} />
          <ScoreItem label="성실성" score={result.scores.conscientiousness} />
          <ScoreItem label="친화성" score={result.scores.agreeableness} />
          <ScoreItem label="정서 안정성" score={result.scores.neuroticism} />
        </View>
      </ScrollView>
    </View>
  );
}

const ScoreItem = ({ label, score }: { label: string; score: number }) => (
  <View style={styles.scoreItem}>
    <Text style={styles.scoreLabel}>{label}</Text>
    <Text style={styles.scoreValue}>{score}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  recommend: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 32,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  scoreContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  scoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scoreLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.point,
  },
}); 