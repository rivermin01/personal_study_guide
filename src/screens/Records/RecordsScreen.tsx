import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { getAllTestResults } from '../../utils/firebase';
import { TestResult } from '../../types/result';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function RecordsScreen() {
  const [records, setRecords] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  const loadRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const results = await getAllTestResults();
      // 날짜순 정렬 (최신순)
      const sortedResults = results.sort((a, b) => b.timestamp - a.timestamp);
      setRecords(sortedResults);
    } catch (error) {
      setError('기록을 불러오는데 실패했습니다.');
      console.error('Error loading records:', error);
    } finally {
      setLoading(false);
    }
  };

  // 탭이 포커스될 때마다 데이터를 다시 불러옵니다.
  useFocusEffect(
    React.useCallback(() => {
      loadRecords();
    }, [])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: TestResult }) => (
    <TouchableOpacity
      style={styles.recordItem}
      onPress={() => navigation.navigate('기록 상세', { result: item })}
    >
      <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
      <Text style={styles.typeText}>{item.personalityType.split(':')[0]}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.point} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadRecords}>
          <Text style={styles.retryText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (records.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>아직 검사 기록이 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  listContent: {
    padding: 16,
  },
  recordItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  typeText: {
    fontSize: 14,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.point,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 