import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
      <Text style={styles.questionNumber}>{currentIndex + 1} / {questions.length}</Text>
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
              <Text style={styles.scoreText}>{score}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.prevButton} onPress={handlePrevious}>
        <Text style={styles.prevText}>← 이전 문항</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, // 2번 색상 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  questionNumber: { fontSize: 16, marginBottom: 10 },
  questionText: { fontSize: 20, fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  scoreButtons: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 24 },
  scoreButton: {
    backgroundColor: COLORS.point, // 1번 색상
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 8,
    margin: 4,
  },
  selectedButton: {
    backgroundColor: '#D188A8', // 선택 시 진한 핑크
  },
  scoreText: { color: '#fff', fontSize: 16 },
  prevButton: { position: 'absolute', bottom: 40 },
  prevText: { color: COLORS.text, fontSize: 16 },
});