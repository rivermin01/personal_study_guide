import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
} from 'react-native';
import { COLORS } from '../../constants/colors';
import { saveStudySession, getStudyAnalytics, getAIFeedback } from '../../utils/timerService';
import { StudyAnalytics, TimerSettings, MLPrediction, FeedbackResponse, StudySegment, BreakSegment } from '../../types/timer';
import { Ionicons } from '@expo/vector-icons';

const DEFAULT_SETTINGS: TimerSettings = {
  studyDuration: 25, // 25분
  breakDuration: 5, // 5분
  longBreakDuration: 15, // 15분
  sessionsBeforeLongBreak: 4,
};

export default function TimerScreen() {
  // 메인 타이머 제어 상태
  const [isStudyRunning, setIsStudyRunning] = useState(false); // 학습 스톱워치 실행 중인가?
  const [isBreakRunning, setIsBreakRunning] = useState(false); // 휴식 스톱워치 실행 중인가?
  const [currentStudySegmentTime, setCurrentStudySegmentTime] = useState(0); // 현재 활성 학습 세그먼트 시간 (표시용)
  const [currentBreakSegmentTime, setCurrentBreakSegmentTime] = useState(0); // 현재 활성 휴식 세그먼트 시간 (표시용)
  const [elapsedStudyTime, setElapsedStudyTime] = useState(0); // 세션에 누적된 총 학습 시간
  const [elapsedBreakTime, setElapsedBreakTime] = useState(0); // 세션에 누적된 총 휴식 시간
  const [studySegmentCount, setStudySegmentCount] = useState(0); // 완료/시작된 학습 세그먼트 수
  const [breakSegmentCount, setBreakSegmentCount] = useState(0); // 완료/시작된 휴식 세그먼트 수

  // 개별 세그먼트 관리를 위한 새로운 상태
  const [sessionStudySegments, setSessionStudySegments] = useState<StudySegment[]>([]);
  const [sessionBreakSegments, setSessionBreakSegments] = useState<BreakSegment[]>([]);
  const [currentActiveStudySegment, setCurrentActiveStudySegment] = useState<StudySegment | null>(null);
  const [currentActiveBreakSegment, setCurrentActiveBreakSegment] = useState<BreakSegment | null>(null);

  // 기존 상태 (재평가될 수 있음)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [score, setScore] = useState('70');
  const [lastStudyDuration, setLastStudyDuration] = useState(0); // 피드백 모달에 사용되는 총 경과 학습 시간
  const [predictedNextDuration, setPredictedNextDuration] = useState(0);
  const [predictedNextBreakTime, setPredictedNextBreakTime] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<FeedbackResponse | null>(null);

  // 시간을 hh:mm:ss 형식으로 포맷팅하는 헬퍼 함수
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 타이머 인터벌 효과
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isStudyRunning) {
      interval = setInterval(() => {
        setCurrentStudySegmentTime(prev => prev + 1);
        setElapsedStudyTime(prev => prev + 1);
      }, 1000);
    } else if (isBreakRunning) {
      interval = setInterval(() => {
        setCurrentBreakSegmentTime(prev => prev + 1);
        setElapsedBreakTime(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isStudyRunning, isBreakRunning]);

  // 분석 데이터 로드 (ML 예측 포함)
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await getStudyAnalytics();
      setAnalytics(data);

      console.log('Analytics Data:', data);
      console.log('Recommended Study Duration (minutes):', data.recommendedStudyDuration);
      console.log('Recommended Break Duration (minutes):', data.recommendedBreakDuration);
      console.log('ML Confidence:', data.mlConfidence);

      // ML 예측 결과로 타이머 기본값 및 예측 시간 업데이트
      // predictedNextDuration과 predictedNextBreakTime은 초 단위로 저장되어야 합니다.
      if (data.mlConfidence > 0.3) {
        setPredictedNextDuration(data.recommendedStudyDuration * 60); 
        setPredictedNextBreakTime(data.recommendedBreakDuration * 60);
      } else {
        // ML 예측 신뢰도가 낮으면 기본값 사용 (초 단위로 변환하여 저장)
        setPredictedNextDuration(DEFAULT_SETTINGS.studyDuration * 60);
        setPredictedNextBreakTime(DEFAULT_SETTINGS.breakDuration * 60);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // 에러 발생 시 기본값으로 설정
      setPredictedNextDuration(DEFAULT_SETTINGS.studyDuration * 60);
      setPredictedNextBreakTime(DEFAULT_SETTINGS.breakDuration * 60);
    }
  }, []);

  // 타이머 리셋
  const resetTimer = useCallback(() => {
    setIsStudyRunning(false);
    setIsBreakRunning(false);
    setCurrentStudySegmentTime(0);
    setCurrentBreakSegmentTime(0);
    setElapsedStudyTime(0);
    setElapsedBreakTime(0);
    setStudySegmentCount(0); 
    setBreakSegmentCount(0); 
    setCurrentSessionId(null);
    setSessionStartTime(null);
    setScore('70');
    setLastStudyDuration(0); 
    // resetTimer 호출 시 예측 시간은 초기화하지 않음 (새 세션 시작 시 다시 로드되므로)
    // setPredictedNextDuration(0); 
    // setPredictedNextBreakTime(0); 
    setShowFeedbackModal(false); 
    setAiFeedback(null);
    setSessionStudySegments([]); // 세그먼트 배열 초기화
    setSessionBreakSegments([]); // 세그먼트 배열 초기화
    setCurrentActiveStudySegment(null); // 활성 세그먼트 초기화
    setCurrentActiveBreakSegment(null); // 활성 세그먼트 초기화
    loadAnalytics(); // 분석 데이터 다시 로드
  }, [loadAnalytics]);

  // 타이머 시작/일시정지/재개 핸들러
  const handleStartPauseResume = async () => {
    const now = Date.now();

    if (isStudyRunning) {
      setIsStudyRunning(false); // 학습 스톱워치 일시정지
      if (currentActiveStudySegment) {
        const endedSegment = { ...currentActiveStudySegment, endTime: now, duration: (now - currentActiveStudySegment.startTime) / 1000 };
        setSessionStudySegments(prev => [...prev, endedSegment]);
        setCurrentActiveStudySegment(null); // 활성 학습 세그먼트 지우기
        setCurrentStudySegmentTime(0); // 다음 학습 세그먼트 표시를 위해 초기화
      }

      // 새로운 휴식 세그먼트 시작
      const newBreakSegment: BreakSegment = {
        id: Math.random().toString(36).substr(2, 9),
        startTime: now,
        endTime: 0, // 일시정지/정지 시 업데이트될 예정
        duration: 0, // 일시정지/정지 시 업데이트될 예정
        segmentNumber: breakSegmentCount + 1,
      };
      setCurrentActiveBreakSegment(newBreakSegment);
      setBreakSegmentCount(prev => prev + 1);
      setIsBreakRunning(true);
      setCurrentBreakSegmentTime(0); // 휴식 타이머 0부터 시작

    } else if (isBreakRunning) {
      setIsBreakRunning(false); // 휴식 스톱워치 일시정지
      if (currentActiveBreakSegment) {
        const endedSegment = { ...currentActiveBreakSegment, endTime: now, duration: (now - currentActiveBreakSegment.startTime) / 1000 };
        setSessionBreakSegments(prev => [...prev, endedSegment]);
        setCurrentActiveBreakSegment(null); // 활성 휴식 세그먼트 지우기
        setCurrentBreakSegmentTime(0); // 다음 휴식 세그먼트 표시를 위해 초기화
      }

      // 새로운 학습 세그먼트 시작
      const newStudySegment: StudySegment = {
        id: Math.random().toString(36).substr(2, 9),
        startTime: now,
        endTime: 0,
        duration: 0,
        segmentNumber: studySegmentCount + 1,
      };
      setCurrentActiveStudySegment(newStudySegment);
      setStudySegmentCount(prev => prev + 1);
      setIsStudyRunning(true);
      setCurrentStudySegmentTime(0); // 학습 타이머 0부터 시작

    } else { // 현재 아무것도 실행 중이 아님 (초기 시작 또는 완전히 정지된 상태에서 재개)
      if (studySegmentCount === 0 && breakSegmentCount === 0) { // 완전 처음 시작
        if (!currentSessionId) {
          try {
            setSessionStartTime(now); // 세션 시작 시간 설정
            const sessionId = await saveStudySession({
              startTime: now,
              endTime: 0, duration: 0, subject: '학습', focusScore: 0, timeOfDay: getTimeOfDay(), energy: 5, productivity: 0,
              breaks: [],
              studySegments: [],
              breakSegments: [],
            });
            setCurrentSessionId(sessionId);
          } catch (error) {
            console.error('Error starting session:', error);
            Alert.alert('오류', '세션 시작에 실패했습니다.');
            return;
          }
        }

        const newStudySegment: StudySegment = {
          id: Math.random().toString(36).substr(2, 9),
          startTime: now,
          endTime: 0,
          duration: 0,
          segmentNumber: 1,
        };
        setCurrentActiveStudySegment(newStudySegment);
        setStudySegmentCount(1);
        setIsStudyRunning(true);
        setCurrentStudySegmentTime(0);

      } else { // 일시정지 상태에서 재개 (학습 또는 휴식이 전체 정지 전에 활성 상태였음)
        // 이 경우는 항상 전환되거나 완전히 정지되는 경우에 도달해서는 안 됩니다.
        // 사용자 요청은 전환 또는 초기 시작만을 의미합니다.
        // 만약 이 분기가 실행되면, 전체 정지가 발생한 후 재개가 일어났다는 의미입니다.
        // 이전 세그먼트는 endTimer에서 최종 처리되었어야 합니다.
        // 따라서 이것은 사실상 새로운 세그먼트를 시작하는 것과 같습니다.
        // 학습을 재개할지 휴식을 재개할지 결정해야 합니다.
        // 프롬프트에 따르면 "다시 시작 버튼을 누르면 휴식 시간은 멈춰두고 아까 일시 정지 시켰던 공부 시간을 다시 시작하면서 보여주고"
        // 이는 "재생" 버튼이 학습과 휴식 사이를 전환한다는 것을 의미합니다.
        // 현재 handleStartPauseResume 로직이 이 전환을 처리합니다.
        // 만약 실행 중이 아니고, 세그먼트 수가 0보다 크다면, 마지막 활동 유형을 재개해야 합니다.
        // 이 로직은 "전체 일시정지" 후 "학습 재개"를 처리합니다.
        if (sessionStudySegments.length > 0 && !isBreakRunning) { // 학습 세그먼트가 있고 휴식 중이 아니면 학습 재개로 가정
          const lastStudySeg = sessionStudySegments[sessionStudySegments.length - 1];
          // 마지막 세그먼트가 실제로 일시정지되었는지 (endTime === 0) 또는 완전히 종료되었는지 확인
          if (lastStudySeg && lastStudySeg.endTime === 0) { // 마지막 학습 세그먼트가 종료되지 않았다면 (즉, 일시정지됨)
            // 일시정지 기간을 고려하여 startTime을 `now`로 업데이트
            const resumedSegment = { ...lastStudySeg, startTime: now };
            setCurrentActiveStudySegment(resumedSegment); // 계속 카운트하기 위해 다시 활성화
            setIsStudyRunning(true);
          } else { // 모든 학습 세그먼트가 종료되었으므로 새로운 세그먼트 시작
            const newStudySegment: StudySegment = {
              id: Math.random().toString(36).substr(2, 9),
              startTime: now,
              endTime: 0,
              duration: 0,
              segmentNumber: studySegmentCount + 1,
            };
            setCurrentActiveStudySegment(newStudySegment);
            setStudySegmentCount(prev => prev + 1);
            setIsStudyRunning(true);
            setCurrentStudySegmentTime(0);
          }
        } else if (sessionBreakSegments.length > 0 && !isStudyRunning) { // 휴식 세그먼트가 있고 학습 중이 아니면 휴식 재개로 가정
          const lastBreakSeg = sessionBreakSegments[sessionBreakSegments.length - 1];
          // 마지막 세그먼트가 실제로 일시정지되었는지 (endTime === 0) 또는 완전히 종료되었는지 확인
          if (lastBreakSeg && lastBreakSeg.endTime === 0) { // 마지막 휴식 세그먼트가 종료되지 않았다면 (즉, 일시정지됨)
            // 일시정지 기간을 고려하여 startTime을 `now`로 업데이트
            const resumedSegment = { ...lastBreakSeg, startTime: now };
            setCurrentActiveBreakSegment(resumedSegment); // 계속 카운트하기 위해 다시 활성화
            setIsBreakRunning(true);
          } else { // 모든 휴식 세그먼트가 종료되었으므로 새로운 세그먼트 시작
            const newBreakSegment: BreakSegment = {
              id: Math.random().toString(36).substr(2, 9),
              startTime: now,
              endTime: 0,
              duration: 0,
              segmentNumber: breakSegmentCount + 1,
            };
            setCurrentActiveBreakSegment(newBreakSegment);
            setBreakSegmentCount(prev => prev + 1);
            setIsBreakRunning(true);
            setCurrentBreakSegmentTime(0);
          }
        } else { // 정말 초기 상태 또는 오류
          Alert.alert('알림', '세션을 시작합니다.');
          resetTimer(); // 예상치 못한 상태일 경우 새 세션을 효과적으로 시작
        }
      }
    }
  };

  // 타이머 종료
  const endTimer = useCallback(() => {
    const now = Date.now();
    setIsStudyRunning(false);
    setIsBreakRunning(false);

    // 현재 활성화된 세그먼트가 있다면 종료 처리
    let finalStudySegments = [...sessionStudySegments];
    let finalBreakSegments = [...sessionBreakSegments];

    if (currentActiveStudySegment) {
      const endedSegment = { ...currentActiveStudySegment, endTime: now, duration: (now - currentActiveStudySegment.startTime) / 1000 };
      finalStudySegments.push(endedSegment);
      setCurrentActiveStudySegment(null);
    } else if (currentActiveBreakSegment) {
      const endedSegment = { ...currentActiveBreakSegment, endTime: now, duration: (now - currentActiveBreakSegment.startTime) / 1000 };
      finalBreakSegments.push(endedSegment);
      setCurrentActiveBreakSegment(null);
    }
    
    // 스코어 모달을 띄우기 전에 최종 세그먼트 상태를 업데이트
    setSessionStudySegments(finalStudySegments);
    setSessionBreakSegments(finalBreakSegments);

    // 총 공부 시간 계산 (피드백 모달용)
    const totalDuration = finalStudySegments.reduce((sum, seg) => sum + seg.duration, 0);
    setLastStudyDuration(totalDuration); 

    // 기록된 공부 또는 휴식 세그먼트가 있는지 확인
    if (finalStudySegments.length > 0 || finalBreakSegments.length > 0) {
      setShowScoreModal(true);
    } else {
      Alert.alert('알림', '기록을 먼저 시작해주세요.');
      resetTimer(); // 활동이 없으면 타이머 리셋
    }
  }, [currentActiveStudySegment, currentActiveBreakSegment, sessionStudySegments, sessionBreakSegments, resetTimer]);

  // 점수 제출
  const submitScore = async () => {
    const scoreNum = parseInt(score);
    if (scoreNum >= 1 && scoreNum <= 100) {
      try {
        if (currentSessionId) {
          const totalStudyDuration = sessionStudySegments.reduce((sum, seg) => sum + seg.duration, 0);
          const totalBreakDuration = sessionBreakSegments.reduce((sum, seg) => sum + seg.duration, 0);

          await saveStudySession({
            startTime: sessionStartTime || Date.now(),
            endTime: Date.now(),
            duration: totalStudyDuration,
            subject: '학습',
            breaks: [],
            focusScore: scoreNum,
            timeOfDay: getTimeOfDay(),
            energy: 5,
            productivity: scoreNum,
            studySegments: sessionStudySegments,
            breakSegments: sessionBreakSegments,
          }, currentSessionId);
        }

        // 세션 점수 제출 후 항상 피드백 모달을 표시
        setShowScoreModal(false); // 점수 입력 모달 닫기
        setShowFeedbackModal(true); // 피드백 모달 열기

        await loadAnalytics(); // 최신 분석 데이터 로드

        const updatedAnalytics = await getStudyAnalytics();
        if (updatedAnalytics?.sessions) {
          try {
            const feedback = await getAIFeedback(updatedAnalytics.sessions);
            setAiFeedback(feedback);
          } catch (feedbackError) {
            console.error('Error getting AI feedback:', feedbackError);
            setAiFeedback({
              summary: "AI 피드백을 불러오는 데 실패했습니다.",
              strengths: [],
              areasForImprovement: [],
              recommendations: ["네트워크 연결을 확인하거나 서버 관리자에게 문의하세요."]
            });
          }
        } else {
            setAiFeedback({
              summary: "분석할 세션 데이터가 충분하지 않습니다.",
              strengths: [],
              areasForImprovement: [],
              recommendations: ["몇 번의 학습 세션을 기록한 후 다시 시도해주세요."]
            });
        }
        
        // 점수 초기화는 모달 닫을 때 resetTimer에서 처리
        // AI 분석 모달이 닫힐 때 호출되도록 여기서는 제거

      } catch (error) {
        console.error('Error saving session or general prediction:', error);
        Alert.alert('오류', '세션 저장 및 분석에 실패했습니다.');
        // 중대한 오류 발생 시 모달 모두 닫기
        setShowScoreModal(false);
        setShowFeedbackModal(false);
      }
    } else {
      Alert.alert('오류', '1부터 100 사이의 점수를 입력해주세요.');
    }
  };

  // 시간대 계산
  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  };

  // 컴포넌트 마운트 시 분석 데이터 로드
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>
          {isStudyRunning || !isBreakRunning ? formatTime(currentStudySegmentTime) : formatTime(currentBreakSegmentTime)}
        </Text>
        <Text style={styles.statusText}>
          {isStudyRunning ? `공부 중 (${studySegmentCount}번째)` :
           (isBreakRunning ? `휴식 중 (${breakSegmentCount}번째)` : 
           (studySegmentCount > 0 || breakSegmentCount > 0 ? '일시정지' : '시작 대기'))}
        </Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={handleStartPauseResume}
          >
            <Ionicons
              name={(isStudyRunning || isBreakRunning) ? 'pause' : 'play'}
              size={24}
              color={COLORS.white}
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.button} onPress={endTimer}>
            <Ionicons name="stop" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={showScoreModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>세션 통계</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>총 공부 시간</Text>
                <Text style={styles.statValue}>
                  {Math.floor(sessionStudySegments.reduce((sum, seg) => sum + seg.duration, 0) / 60)}분
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>총 휴식 시간</Text>
                <Text style={styles.statValue}>
                  {Math.floor(sessionBreakSegments.reduce((sum, seg) => sum + seg.duration, 0) / 60)}분
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>공부 횟수</Text>
                <Text style={styles.statValue}>{sessionStudySegments.length}회</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>휴식 횟수</Text>
                <Text style={styles.statValue}>{sessionBreakSegments.length}회</Text>
              </View>
            </View>

            <Text style={styles.modalSubtitle}>이번 학습 세션은 어땠나요?</Text>
            <Text style={styles.modalSubtitle}>1-100점 사이로 평가해주세요</Text>
            
            <TextInput
              style={styles.scoreInput}
              keyboardType="number-pad"
              value={score}
              onChangeText={setScore}
              maxLength={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowScoreModal(false);
                  resetTimer();
                }}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={submitScore}
              >
                <Text style={styles.modalButtonText}>저장</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showFeedbackModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>세션 요약</Text>
            <Text style={styles.feedbackText}>
              이번 공부는 {Math.floor(lastStudyDuration / 60)}분 동안 진행했으며 점수는 {score}점으로 다음 공부는 {Math.floor(predictedNextDuration / 60)}분 후에 {Math.floor(predictedNextBreakTime / 60)}분 휴식하면 좋을 것 같습니다.
            </Text>
            {aiFeedback && (
              <View style={styles.aiFeedbackContainer}>
                <Text style={styles.aiFeedbackTitle}>AI 학습 진단</Text>
                {aiFeedback.summary && <Text style={styles.aiFeedbackSectionTitle}>{aiFeedback.summary}</Text>}
                {aiFeedback.strengths.length > 0 && (
                  <View>
                    <Text style={styles.aiFeedbackSectionTitle}>강점:</Text>
                    {aiFeedback.strengths.map((item, index) => (
                      <Text key={index} style={styles.aiFeedbackItem}>• {item}</Text>
                    ))}
                  </View>
                )}
                {aiFeedback.areasForImprovement.length > 0 && (
                  <View>
                    <Text style={styles.aiFeedbackSectionTitle}>개선 필요 영역:</Text>
                    {aiFeedback.areasForImprovement.map((item, index) => (
                      <Text key={index} style={styles.aiFeedbackItem}>• {item}</Text>
                    ))}
                  </View>
                )}
                {aiFeedback.recommendations.length > 0 && (
                  <View>
                    <Text style={styles.aiFeedbackSectionTitle}>추천:</Text>
                    {aiFeedback.recommendations.map((item, index) => (
                      <Text key={index} style={styles.aiFeedbackItem}>• {item}</Text>
                    ))}
                  </View>
                )}
              </View>
            )}
            <TouchableOpacity
              style={[styles.modalButton, styles.submitButton]}
              onPress={() => {
                setShowFeedbackModal(false);
                resetTimer(); // 모달 닫을 때 타이머 리셋 및 점수 초기화
              }}
            >
              <Text style={styles.modalButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {analytics && (
        <View style={styles.analyticsContainer}>
          <Text style={styles.analyticsTitle}>학습 분석</Text>
          
          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>최적 학습 시간대</Text>
            <Text style={styles.analyticsValue}>
              {analytics.bestTimeOfDay === 'morning' && '오전'}
              {analytics.bestTimeOfDay === 'afternoon' && '오후'}
              {analytics.bestTimeOfDay === 'evening' && '저녁'}
              {analytics.bestTimeOfDay === 'night' && '밤'}
            </Text>
          </View>

          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>추천 학습 시간</Text>
            <Text style={styles.analyticsValue}>
              {Math.round(analytics.recommendedStudyDuration)}분
            </Text>
          </View>

          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>추천 휴식 시간</Text>
            <Text style={styles.analyticsValue}>
              {analytics.recommendedBreakDuration}분
            </Text>
          </View>

          <View style={styles.analyticsItem}>
            <Text style={styles.analyticsLabel}>평균 점수</Text>
            <Text style={styles.analyticsValue}>
              {Math.round(analytics.focusScore)}점
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 32,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 32,
    gap: 16,
  },
  button: {
    backgroundColor: COLORS.point,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsContainer: {
    padding: 24,
    backgroundColor: COLORS.white,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  analyticsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.text,
  },
  analyticsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  analyticsLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.point,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 24,
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    padding: 12,
    width: '100%',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#dee2e6',
  },
  submitButton: {
    backgroundColor: COLORS.point,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  feedbackText: {
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 26,
  },
  aiFeedbackContainer: {
    marginTop: 20,
    width: '100%',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f3f5',
  },
  aiFeedbackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  aiFeedbackSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 10,
    marginBottom: 5,
  },
  aiFeedbackItem: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 3,
  },
  statsContainer: {
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.point,
  },
}); 