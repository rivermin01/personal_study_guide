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
  // Main timer control states
  const [isStudyRunning, setIsStudyRunning] = useState(false); // Is study stopwatch running?
  const [isBreakRunning, setIsBreakRunning] = useState(false); // Is break stopwatch running?
  const [currentStudySegmentTime, setCurrentStudySegmentTime] = useState(0); // Current active study segment time (for display)
  const [currentBreakSegmentTime, setCurrentBreakSegmentTime] = useState(0); // Current active break segment time (for display)
  const [elapsedStudyTime, setElapsedStudyTime] = useState(0); // Total accumulated study time for the session
  const [elapsedBreakTime, setElapsedBreakTime] = useState(0); // Total accumulated break time for the session
  const [studySegmentCount, setStudySegmentCount] = useState(0); // Number of study segments completed/started
  const [breakSegmentCount, setBreakSegmentCount] = useState(0); // Number of break segments completed/started

  // New states for managing individual segments
  const [sessionStudySegments, setSessionStudySegments] = useState<StudySegment[]>([]);
  const [sessionBreakSegments, setSessionBreakSegments] = useState<BreakSegment[]>([]);
  const [currentActiveStudySegment, setCurrentActiveStudySegment] = useState<StudySegment | null>(null);
  const [currentActiveBreakSegment, setCurrentActiveBreakSegment] = useState<BreakSegment | null>(null);

  // Existing states, potentially re-evaluated
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<StudyAnalytics | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [score, setScore] = useState('70');
  const [lastStudyDuration, setLastStudyDuration] = useState(0); // Used for feedback modal (this will be total elapsed study time)
  const [predictedNextDuration, setPredictedNextDuration] = useState(0);
  const [predictedNextBreakTime, setPredictedNextBreakTime] = useState(0);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<FeedbackResponse | null>(null);

  // Helper to format time to hh:mm:ss
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Timer interval effect
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

      // ML 예측 결과로 타이머 기본값 및 예측 시간 업데이트
      if (data.mlConfidence > 0.3) {
        setPredictedNextDuration(data.recommendedStudyDuration); 
        setPredictedNextBreakTime(data.recommendedBreakDuration);
      } else {
        setPredictedNextDuration(25 * 60);
        setPredictedNextBreakTime(5 * 60);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      // 에러 발생 시 기본값으로 설정
      setPredictedNextDuration(25 * 60);
      setPredictedNextBreakTime(5 * 60);
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
    setPredictedNextDuration(0); 
    setPredictedNextBreakTime(0); 
    setShowFeedbackModal(false); 
    setAiFeedback(null);
    setSessionStudySegments([]); // Reset segment arrays
    setSessionBreakSegments([]); // Reset segment arrays
    setCurrentActiveStudySegment(null); // Reset active segments
    setCurrentActiveBreakSegment(null); // Reset active segments
    loadAnalytics(); // 분석 데이터 다시 로드
  }, [loadAnalytics]);

  // 타이머 시작/일시정지/재개 핸들러
  const handleStartPauseResume = async () => {
    const now = Date.now();

    if (isStudyRunning) {
      setIsStudyRunning(false); // Pause study stopwatch
      if (currentActiveStudySegment) {
        const endedSegment = { ...currentActiveStudySegment, endTime: now, duration: (now - currentActiveStudySegment.startTime) / 1000 };
        setSessionStudySegments(prev => [...prev, endedSegment]);
        setCurrentActiveStudySegment(null); // Clear active study segment
        setCurrentStudySegmentTime(0); // Reset display for next study segment
      }

      // Start new break segment
      const newBreakSegment: BreakSegment = {
        id: Math.random().toString(36).substr(2, 9),
        startTime: now,
        endTime: 0, // Will be updated on pause/stop
        duration: 0, // Will be updated on pause/stop
        segmentNumber: breakSegmentCount + 1,
      };
      setCurrentActiveBreakSegment(newBreakSegment);
      setBreakSegmentCount(prev => prev + 1);
      setIsBreakRunning(true);
      setCurrentBreakSegmentTime(0); // Start break timer from 0

    } else if (isBreakRunning) {
      setIsBreakRunning(false); // Pause break stopwatch
      if (currentActiveBreakSegment) {
        const endedSegment = { ...currentActiveBreakSegment, endTime: now, duration: (now - currentActiveBreakSegment.startTime) / 1000 };
        setSessionBreakSegments(prev => [...prev, endedSegment]);
        setCurrentActiveBreakSegment(null); // Clear active break segment
        setCurrentBreakSegmentTime(0); // Reset display for next break segment
      }

      // Start new study segment
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
      setCurrentStudySegmentTime(0); // Start study timer from 0

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

      } else { // Resume from a paused state (either study or break was active before total stop)
        // This case should not be reached if it's always switching or stopping fully.
        // The user's request implies only switching or initial start.
        // If this branch is hit, it means a full stop happened and then resume.
        // The previous segments should have been finalized in endTimer.
        // So, this is effectively starting a brand new segment.
        // We need to determine if we are resuming study or break.
        // Based on the prompt, it seems "다시 시작 버튼을 누르면 휴식 시간은 멈춰두고 아까 일시 정지 시켰던 공부 시간을 다시 시작하면서 보여주고"
        // implies the "play" button will toggle between study and break.
        // The current handleStartPauseResume logic handles this toggle.
        // If it's *not* running, and segment counts > 0, it should be resuming the *last* type of activity.
        // This logic handles a "total pause" and then "resume study".
        if (sessionStudySegments.length > 0 && !isBreakRunning) { // If there were study segments, assume we resume study
          const lastStudySeg = sessionStudySegments[sessionStudySegments.length - 1];
          // Check if the last segment was actually paused (endTime === 0) or fully ended
          if (lastStudySeg && lastStudySeg.endTime === 0) { // If last study segment was not ended (i.e. paused)
            // Update its startTime to `now` to account for the pause duration
            const resumedSegment = { ...lastStudySeg, startTime: now };
            setCurrentActiveStudySegment(resumedSegment); // Re-activate it to continue counting
            setIsStudyRunning(true);
          } else { // All study segments ended, start a new one
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
        } else if (sessionBreakSegments.length > 0 && !isStudyRunning) { // If there were break segments, assume we resume break
          const lastBreakSeg = sessionBreakSegments[sessionBreakSegments.length - 1];
          // Check if the last segment was actually paused (endTime === 0) or fully ended
          if (lastBreakSeg && lastBreakSeg.endTime === 0) { // If last break segment was not ended (i.e. paused)
            // Update its startTime to `now` to account for the pause duration
            const resumedSegment = { ...lastBreakSeg, startTime: now };
            setCurrentActiveBreakSegment(resumedSegment); // Re-activate it to continue counting
            setIsBreakRunning(true);
          } else { // All break segments ended, start a new one
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
        } else { // Truly initial state or error
          Alert.alert('알림', '세션을 시작합니다.');
          resetTimer(); // Effectively starts a new session if in an unexpected state
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
      Alert.alert('알림', '기록된 학습 활동이 없어 세션이 종료됩니다.');
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
        
        // setScore('70'); // 점수 초기화는 모달 닫을 때 resetTimer에서 처리
        // resetTimer(); // AI 분석 모달이 닫힐 때 호출되도록 여기서는 제거

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
              {Math.round(analytics.recommendedStudyDuration / 60)}분
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