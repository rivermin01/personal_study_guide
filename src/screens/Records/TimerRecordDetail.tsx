import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { COLORS } from '../../constants/colors';
import { TimerRecord } from '../../types/records';
import { formatDate } from '../../utils/date';

type TimerRecordDetailProps = {
  route: RouteProp<{
    params: {
      record: TimerRecord;
    };
  }, 'params'>;
};

export default function TimerRecordDetail({ route }: TimerRecordDetailProps) {
  const { record } = route.params;
  const duration = Math.round(record.duration / (1000 * 60)); // 분 단위로 변환

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{record.subject}</Text>
        <Text style={styles.date}>{formatDate(record.startTime)}</Text>

        <View style={styles.statContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>총 공부 시간</Text>
            <Text style={styles.statValue}>{duration}분</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>집중도</Text>
            <Text style={styles.statValue}>{record.focusScore}/5</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>시간대</Text>
            <Text style={styles.statValue}>
              {record.timeOfDay === 'morning' && '아침'}
              {record.timeOfDay === 'afternoon' && '오후'}
              {record.timeOfDay === 'evening' && '저녁'}
              {record.timeOfDay === 'night' && '밤'}
            </Text>
          </View>
        </View>

        <View style={styles.breakSection}>
          <Text style={styles.sectionTitle}>휴식 기록</Text>
          {record.breaks.map((breakItem, index) => {
            const breakDuration = Math.round(breakItem.duration / (1000 * 60));
            return (
              <View key={index} style={styles.breakItem}>
                <Text style={styles.breakTime}>
                  {formatDate(breakItem.startTime)} ~ {formatDate(breakItem.endTime)}
                </Text>
                <Text style={styles.breakDuration}>{breakDuration}분</Text>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  statContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  breakSection: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  breakItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  breakTime: {
    fontSize: 14,
    color: '#666',
  },
  breakDuration: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
}); 