import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/colors';
import { RouteProp, useRoute } from '@react-navigation/native';
import { saveTestResult } from '../../utils/firebase';
import { TestResult } from '../../types/result';

type RootStackParamList = {
  결과: { answers: number[] };
};

type ResultScreenRouteProp = RouteProp<RootStackParamList, '결과'>;

export default function ResultScreen() {
  const route = useRoute<ResultScreenRouteProp>();
  const { answers } = route.params;
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const average = (arr: number[]) =>
    Math.round((arr.reduce((sum, val) => sum + val, 0) / arr.length) * 10) / 10;

  // 간단한 Big Five 성향 계산 예시
  const extraversion = average([answers[0], 8 - answers[1]]); // 외향성
  const openness = average([answers[8], answers[6]]); // 개방성
  const conscientiousness = average([8 - answers[3], answers[9]]); // 성실성
  const agreeableness = average([answers[4], 8 - answers[2]]); // 친화성
  const neuroticism = average([answers[5], 8 - answers[7]]); // 정서적 불안정성

  const personalityTypes = [
    {
      label: '🧠 사색형 전략가',
      description: '내면 중심적이지만 분석적이고 전략적인 사고를 선호합니다.',
      vector: [2, 6, 6, 4, 4],
      recommendation: '계획적이고 구조화된 자기 주도 학습 방식이 잘 맞습니다. 노션, 플래너 등을 적극 활용하세요.',
    },
    {
      label: '🔍 조용한 탐구자',
      description: '조용하고 차분하게 세상을 탐색하는 스타일입니다.',
      vector: [2, 4, 4, 4, 4],
      recommendation: '조용한 환경에서 집중할 수 있는 개별 학습법이 효과적입니다. 독서실, 도서관 활용을 추천합니다.',
    },
    {
      label: '🧭 책임감 있는 주도자',
      description: '이끄는 데 능하고 감정 조절이 뛰어난 리더형입니다.',
      vector: [6, 4, 6, 4, 6],
      recommendation: '목표 설정과 팀 프로젝트 등에서 리더 역할을 맡아보세요. 스터디 그룹 주도에 적합합니다.',
    },
    {
      label: '🎨 자유로운 탐험가',
      description: '창의적이며 계획보다는 유연한 모험가형입니다.',
      vector: [6, 6, 2, 4, 4],
      recommendation: '엄격한 계획보다는 프로젝트 기반, 실습 중심의 학습이 잘 맞습니다. 다양한 시도를 두려워하지 마세요.',
    },
    {
      label: '🤝 감성적인 협업가',
      description: '공감 능력이 뛰어나고 타인과 잘 어울리지만 감정적일 수 있습니다.',
      vector: [4, 4, 4, 6, 2],
      recommendation: '친구와 함께하는 협력 학습, 토론, 그룹 스터디가 동기 부여에 도움이 됩니다.',
    },
    {
      label: '💼 신중한 실무가',
      description: '조용하지만 책임감 있고 실용적인 방식으로 일 처리합니다.',
      vector: [2, 2, 6, 4, 4],
      recommendation: '체계적이고 반복적인 연습문제 풀이, 체크리스트를 통한 실전 위주 학습이 효과적입니다.',
    },
    {
      label: '📈 균형 잡힌 현실가',
      description: '안정적이고 현실적인 판단을 하는 유형입니다.',
      vector: [4, 4, 4, 4, 4],
      recommendation: '다양한 학습법을 시도하며 자신에게 맞는 방법을 찾아보세요. 균형 잡힌 시간 분배가 중요합니다.',
    },
    {
      label: '🧩 다재다능 창의인',
      description: '다양한 분야에 관심이 많고 다방면으로 융통성 있습니다.',
      vector: [4, 6, 4, 4, 4],
      recommendation: '여러 과목을 병행하거나 크로스오버 학습법, 멀티태스킹이 잘 맞습니다.',
    },
    {
      label: '🔒 감정적 보호자',
      description: '내향적이고 배려는 많지만 감정적으로 불안정할 수 있습니다.',
      vector: [2, 4, 4, 6, 2],
      recommendation: '편안한 공간에서 스스로 학습하고, 필요시 감정일기를 통해 자신을 점검하세요.',
    },
    {
      label: '✨ 이상주의 사색가',
      description: '자신만의 세계가 확고한 상상력 중심의 사고형입니다.',
      vector: [2, 6, 4, 4, 4],
      recommendation: '마인드맵, 에세이, 창의적 글쓰기 등 자유로운 표현이 가능한 학습법이 적합합니다.',
    },
    {
      label: '🔥 열정적인 추진가',
      description: '열정적이면서 실행력 있는 창의 실천가입니다.',
      vector: [6, 6, 6, 4, 4],
      recommendation: '목표를 세우고 바로 실행하는 액션 플랜, 도전적인 과제에 도전해보세요.',
    },
    {
      label: '🌱 평화로운 중재자',
      description: '주변과의 조화를 잘 이루는 온화하고 균형 잡힌 사람입니다.',
      vector: [4, 4, 4, 6, 6],
      recommendation: '협력과 조화를 중시하는 그룹 학습, 피드백과 토론이 포함된 환경이 좋습니다.',
    },
  ];

  const determinePersonalityType = () => {
    const userVector = [extraversion, openness, conscientiousness, agreeableness, neuroticism];

    const euclideanDistance = (v1: number[], v2: number[]) =>
      Math.sqrt(v1.reduce((sum, val, i) => sum + Math.pow(val - v2[i], 2), 0));

    const closest = personalityTypes.reduce((prev, curr) => {
      const prevDist = euclideanDistance(userVector, prev.vector);
      const currDist = euclideanDistance(userVector, curr.vector);
      return currDist < prevDist ? curr : prev;
    });

    return `${closest.label}: ${closest.description}`;
  };

  const determineRecommendation = () => {
    return personalityTypes.find(p =>
      p.label === determinePersonalityType().split(':')[0]
    )?.recommendation ?? '';
  };

  const personalityType = determinePersonalityType();
  const recommendation = determineRecommendation();

  useEffect(() => {
    const saveResult = async () => {
      try {
        setSaving(true);
        const result: Omit<TestResult, 'id'> = {
          timestamp: Date.now(),
          answers,
          personalityType,
          scores: {
            extraversion,
            openness,
            conscientiousness,
            agreeableness,
            neuroticism
          },
          recommendation
        };
        
        await saveTestResult(result);
        setSaved(true);
      } catch (error) {
        console.error('Failed to save result:', error);
      } finally {
        setSaving(false);
      }
    };

    saveResult();
  }, []);

  return (
    <View style={styles.container}>
      {saving ? (
        <ActivityIndicator size="large" color={COLORS.point} />
      ) : (
        <>
          <Text style={styles.title}>{personalityType}</Text>
          <Text style={styles.recommend}>{recommendation}</Text>
          <Text style={styles.title}>검사 결과 요약</Text>
          <Text style={styles.result}>외향성: {extraversion}</Text>
          <Text style={styles.result}>개방성: {openness}</Text>
          <Text style={styles.result}>성실성: {conscientiousness}</Text>
          <Text style={styles.result}>친화성: {agreeableness}</Text>
          <Text style={styles.result}>정서 안정성: {neuroticism}</Text>
          {saved && (
            <Text style={styles.savedText}>결과가 저장되었습니다.</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.text,
  },
  recommend: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    color: COLORS.text,
  },
  result: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: COLORS.text,
  },
  savedText: {
    fontSize: 16,
    color: COLORS.point,
    textAlign: 'center',
    marginTop: 20,
  },
});