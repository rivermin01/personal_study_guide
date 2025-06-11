import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { TestRecord, TimerRecord, RecordType } from '../../types/records';
import { formatDate } from '../../utils/date';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RecordsScreen() {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [testRecords, setTestRecords] = useState<TestRecord[]>([]);
  const [timerRecords, setTimerRecords] = useState<TimerRecord[]>([]);
  const [selectedType, setSelectedType] = useState<RecordType>('test');

  useEffect(() => {
    loadRecords();
  }, [selectedType]);

  const loadRecords = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // 검사 기록 로드
      const testQuery = query(
        collection(db, 'testResults'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const testSnapshot = await getDocs(testQuery);
      const testData = testSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TestRecord[];
      setTestRecords(testData);

      // 타이머 기록 로드
      const timerQuery = query(
        collection(db, 'studySessions'),
        where('userId', '==', userId),
        orderBy('startTime', 'desc')
      );
      const timerSnapshot = await getDocs(timerQuery);
      const timerData = timerSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimerRecord[];
      setTimerRecords(timerData);

      setLoading(false);
    } catch (error) {
      console.error('Error loading records:', error);
      setLoading(false);
    }
  };

  const renderTestRecord = ({ item }: { item: TestRecord }) => (
    <TouchableOpacity
      style={styles.recordItem}
    >
      <Text style={styles.recordTitle}>{item.personalityType}</Text>
      {item.recommendation && (
        <Text style={styles.recordRecommendation}>{item.recommendation}</Text>
      )}
      <Text style={styles.recordDate}>{formatDate(item.timestamp)}</Text>
    </TouchableOpacity>
  );

  const renderTimerRecord = ({ item }: { item: TimerRecord }) => {
    const duration = Math.round(item.duration / 60); // 초 단위를 분 단위로 변환
    const totalBreakDuration = Math.round(item.breakSegments.reduce((sum, seg) => sum + seg.duration, 0) / 60); // 총 휴식 시간 (분 단위)
    return (
      <TouchableOpacity
        style={styles.recordItem}
      >
        <Text style={styles.recordTitle}>
          {item.subject} ({duration}분)
        </Text>
        <Text style={styles.recordDate}>{formatDate(item.startTime)}</Text>
        <View style={styles.recordStats}>
          <Text style={styles.recordStat}>집중도: {item.focusScore}</Text>
          <Text style={styles.recordStat}>
            휴식 횟수: {item.breakSegments.length}회({totalBreakDuration}분)
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.point} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedType === 'test' && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedType('test')}
          >
            <Text
              style={[
                styles.segmentButtonText,
                selectedType === 'test' && styles.segmentButtonTextActive,
              ]}
            >
              검사 기록
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedType === 'timer' && styles.segmentButtonActive,
            ]}
            onPress={() => setSelectedType('timer')}
          >
            <Text
              style={[
                styles.segmentButtonText,
                selectedType === 'timer' && styles.segmentButtonTextActive,
              ]}
            >
              타이머 기록
            </Text>
          </TouchableOpacity>
        </View>

        {selectedType === 'test' ? (
          <FlatList
            data={testRecords}
            renderItem={renderTestRecord}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>검사 기록이 없습니다.</Text>
            }
          />
        ) : (
          <FlatList
            data={timerRecords}
            renderItem={renderTimerRecord}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            ListEmptyComponent={
              <Text style={styles.emptyText}>타이머 기록이 없습니다.</Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.point,
  },
  segmentButtonText: {
    fontSize: 16,
    color: '#666',
  },
  segmentButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  recordItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
  },
  recordStats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  recordStat: {
    fontSize: 14,
    color: COLORS.text,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 24,
  },
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  recordRecommendation: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 