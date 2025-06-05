import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';
import { useNavigation } from '@react-navigation/native';

const questions = [
  { id: 1, text: '나는 새로운 사람과 어울리는 것이 어렵지 않다.' },
  { id: 2, text: '나는 혼자 있는 시간을 즐긴다.' },
  { id: 3, text: '나는 감정보다는 이성을 우선시하는 편이다.' },
  { id: 4, text: '나는 계획을 세우기보다 즉흥적으로 행동하는 편이다.' },
  { id: 5, text: '나는 주변 사람의 기분에 민감하게 반응한다.' },
  { id: 6, text: '나는 마감일이 가까워져야 집중이 잘 된다.' },
  { id: 7, text: '나는 세부사항보다는 큰 그림을 중시한다.' },
  { id: 8, text: '나는 지시에 따르기보다는 내 방식대로 하는 걸 선호한다.' },
  { id: 9, text: '나는 새로운 아이디어나 시도를 즐긴다.' },
  { id: 10, text: '나는 일관성과 안정감을 중요하게 여긴다.' },
];

export default function StartTestScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const navigation = useNavigation<any>();
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = score;
    setAnswers(newAnswers);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('결과', { answers: newAnswers });
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentIndex + 1} / {questions.length}</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{questions[currentIndex].text}</Text>

        <View style={styles.scoreButtons}>
          {[1, 2, 3, 4, 5, 6, 7].map(score => {
            const isSelected = answers[currentIndex] === score;
            return (
              <TouchableOpacity
                key={score}
                style={[styles.scoreButton, isSelected && styles.selectedButton]}
                onPress={() => handleAnswer(score)}
              >
                <Text style={[styles.scoreText, isSelected && styles.selectedText]}>
                  {score}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.labelContainer}>
          <Text style={styles.labelText}>전혀 그렇지 않다</Text>
          <Text style={styles.labelText}>매우 그렇다</Text>
        </View>

        {currentIndex > 0 && (
          <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
            <Text style={styles.prevText}>← 이전 문항</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    padding: 20,
    paddingTop: 40,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.point,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  questionContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 40,
    textAlign: 'center',
    color: COLORS.text,
    lineHeight: 32,
  },
  scoreButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  scoreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.point,
  },
  selectedButton: {
    backgroundColor: COLORS.point,
  },
  scoreText: {
    fontSize: 16,
    color: COLORS.point,
    fontWeight: '600',
  },
  selectedText: {
    color: '#fff',
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  labelText: {
    fontSize: 14,
    color: '#666',
  },
  prevButton: {
    position: 'absolute',
    bottom: 40,
    left: 24,
  },
  prevText: {
    color: COLORS.text,
    fontSize: 16,
  },
});