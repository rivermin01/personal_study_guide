import { collection, addDoc, query, where, getDocs, orderBy, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { StudySession, StudyAnalytics, FeedbackResponse } from '../types/timer';
import { predictOptimalStudyPattern } from './mlAnalytics';
import { TimerRecord } from '../types/records';

export const timerService = {
  // 새로운 타이머 세션 시작
  async startSession(subject: string): Promise<string> {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('사용자가 로그인되어 있지 않습니다.');

    const now = Date.now();
    const timeOfDay = getTimeOfDay(now);

    const session: Omit<TimerRecord, 'id'> = {
      userId,
      subject,
      startTime: now,
      endTime: 0,
      duration: 0,
      focusScore: 0,
      timeOfDay,
      studySegments: [],
      breakSegments: []
    };

    const docRef = await addDoc(collection(db, 'studySessions'), session);
    return docRef.id;
  },

  // 휴식 시작
  async startBreak(sessionId: string): Promise<void> {
    const breakStart = Date.now();
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    const session = sessionSnap.data() as TimerRecord;
    
    const newBreakSegment = {
      startTime: breakStart,
      endTime: 0,
      duration: 0,
      segmentNumber: session.breakSegments.length + 1
    };

    await updateDoc(sessionRef, {
      breakSegments: [...session.breakSegments, newBreakSegment]
    });
  },

  // 휴식 종료
  async endBreak(sessionId: string): Promise<void> {
    const breakEnd = Date.now();
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    const session = sessionSnap.data() as TimerRecord;
    
    const breakSegments = [...session.breakSegments];
    const lastBreak = breakSegments[breakSegments.length - 1];
    
    if (lastBreak && !lastBreak.endTime) {
      lastBreak.endTime = breakEnd;
      lastBreak.duration = breakEnd - lastBreak.startTime;
      
      await updateDoc(sessionRef, { breakSegments });
    }
  },

  // 세션 종료
  async endSession(sessionId: string, focusScore: number): Promise<void> {
    const endTime = Date.now();
    const sessionRef = doc(db, 'studySessions', sessionId);
    
    await updateDoc(sessionRef, {
      endTime,
      focusScore,
      duration: endTime - (await this.getStartTime(sessionId))
    });
  },

  // 현재 세션의 휴식 목록 가져오기
  async getBreaks(sessionId: string) {
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    const session = sessionSnap.data() as TimerRecord;
    return session.breakSegments;
  },

  // 세션 시작 시간 가져오기
  async getStartTime(sessionId: string) {
    const sessionRef = doc(db, 'studySessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    const session = sessionSnap.data() as TimerRecord;
    return session.startTime;
  }
};

// 시간대 구하기 (아침: 5-11, 오후: 11-17, 저녁: 17-22, 밤: 22-5)
function getTimeOfDay(timestamp: number): TimerRecord['timeOfDay'] {
  const hour = new Date(timestamp).getHours();
  
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// 학습 세션 저장 또는 업데이트
export const saveStudySession = async (session: Omit<StudySession, 'id' | 'userId'>, sessionId?: string) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const sessionData = {
      ...session,
      userId,
      studySegments: session.studySegments || [],
      breakSegments: session.breakSegments || [],
      focusScore: session.focusScore,
      productivity: session.productivity,
    };

    if (sessionId) {
      const sessionRef = doc(db, 'studySessions', sessionId);
      await updateDoc(sessionRef, sessionData);
      return sessionId;
    } else {
      const docRef = await addDoc(collection(db, 'studySessions'), sessionData);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving study session:', error);
    throw error;
  }
};

// 학습 분석 데이터 가져오기
export const getStudyAnalytics = async (): Promise<StudyAnalytics> => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');

    const q = query(
      collection(db, 'studySessions'),
      where('userId', '==', userId),
      orderBy('startTime', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const sessions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StudySession[];

    let mlPrediction;
    try {
      mlPrediction = await predictOptimalStudyPattern(sessions, new Date().getHours());
    } catch (error) {
      console.error('ML prediction failed:', error);
      mlPrediction = {
        predictedDuration: 25 * 60,
        predictedBreakTime: 5 * 60,
        confidence: 0
      };
    }

    const timeAnalytics = analyzeTimeOfDay(sessions);
    const avgSessionDuration = calculateAverageSessionDuration(sessions);

    return {
      bestTimeOfDay: timeAnalytics.bestTime,
      recommendedStudyDuration: mlPrediction.confidence > 0.7 
        ? Math.round(mlPrediction.predictedDuration / 60) 
        : timeAnalytics.recommendedDuration,
      recommendedBreakDuration: mlPrediction.confidence > 0.7
        ? Math.round(mlPrediction.predictedBreakTime / 60)
        : calculateRecommendedBreak(sessions),
      productivityScore: calculateProductivityScore(sessions),
      focusScore: calculateAverageFocusScore(sessions),
      totalStudyTime: calculateTotalStudyTime(sessions),
      averageSessionDuration: avgSessionDuration,
      mlConfidence: mlPrediction.confidence,
      sessions: sessions,
    };
  } catch (error) {
    console.error('Error getting study analytics:', error);
    throw error;
  }
};

// 시간대별 생산성 분석
const analyzeTimeOfDay = (sessions: StudySession[]) => {
  const timeScores = {
    morning: { total: 0, count: 0 },
    afternoon: { total: 0, count: 0 },
    evening: { total: 0, count: 0 },
    night: { total: 0, count: 0 },
  };

  sessions.forEach(session => {
    timeScores[session.timeOfDay].total += session.productivity;
    timeScores[session.timeOfDay].count += 1;
  });

  let bestTime = 'morning';
  let highestScore = 0;

  Object.entries(timeScores).forEach(([time, data]) => {
    const avgScore = data.count > 0 ? data.total / data.count : 0;
    if (avgScore > highestScore) {
      highestScore = avgScore;
      bestTime = time;
    }
  });

  return {
    bestTime,
    recommendedDuration: calculateRecommendedDuration(sessions, bestTime),
  };
};

// 추천 학습 시간 계산
const calculateRecommendedDuration = (sessions: StudySession[], timeOfDay: string) => {
  const relevantSessions = sessions.filter(s => s.timeOfDay === timeOfDay);
  const productiveSessions = relevantSessions.filter(s => s.productivity >= 4);
  
  if (productiveSessions.length === 0) return 25; // 기본값

  // 각 세션의 총 학습 시간을 합산
  const avgDuration = productiveSessions.reduce((sum, session) => {
    const totalSessionDuration = session.studySegments.reduce((segSum, seg) => segSum + seg.duration, 0);
    return sum + totalSessionDuration;
  }, 0) / productiveSessions.length;

  return Math.max(Math.round(avgDuration / 60), 25); // 분 단위로 반올림하고 최소 25분 보장
};

// 추천 휴식 시간 계산
const calculateRecommendedBreak = (sessions: StudySession[]) => {
  const productiveSessions = sessions.filter(s => s.productivity >= 4);
  
  if (productiveSessions.length === 0) return 5; // 기본값

  // 각 세션의 총 휴식 시간을 합산
  const avgBreakDuration = productiveSessions.reduce((sum, session) => {
    const totalSessionBreakDuration = session.breakSegments.reduce((segSum, seg) => segSum + seg.duration, 0);
    return sum + totalSessionBreakDuration;
  }, 0) / productiveSessions.length;

  return Math.max(Math.round(avgBreakDuration / 60), 5); // 분 단위로 변환하고 최소 5분 보장
};

// 기타 헬퍼 함수들
const calculateProductivityScore = (sessions: StudySession[]) => {
  if (sessions.length === 0) return 0;
  return sessions.reduce((sum, session) => sum + session.productivity, 0) / sessions.length;
};

const calculateAverageFocusScore = (sessions: StudySession[]) => {
  if (sessions.length === 0) return 0;
  return sessions.reduce((sum, session) => sum + session.focusScore, 0) / sessions.length;
};

const calculateTotalStudyTime = (sessions: StudySession[]) => {
  return sessions.reduce((sum, session) => {
    const totalSessionDuration = session.studySegments.reduce((segSum, seg) => segSum + seg.duration, 0);
    return sum + totalSessionDuration;
  }, 0);
};

const calculateAverageSessionDuration = (sessions: StudySession[]) => {
  if (sessions.length === 0) return 0;
  const totalStudyTime = sessions.reduce((sum, session) => {
    const totalSessionDuration = session.studySegments.reduce((segSum, seg) => segSum + seg.duration, 0);
    return sum + totalSessionDuration;
  }, 0);
  return totalStudyTime / sessions.length;
};

export const getAIFeedback = async (sessions: StudySession[]): Promise<FeedbackResponse> => {
  try {
    const response = await fetch('http://localhost:5001/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData: sessions.map(s => ({
          hour: new Date(s.startTime).getHours(),
          dayOfWeek: new Date(s.startTime).getDay(),
          score: s.focusScore, // 1-100점 스케일
          duration: s.studySegments.reduce((sum, seg) => sum + seg.duration, 0), // 총 학습 시간 (초 단위)
          breakTime: s.breakSegments.reduce((sum, seg) => sum + seg.duration, 0), // 총 휴식 시간 (초 단위)
        }))
      }),
    });

    if (!response.ok) {
      throw new Error('AI Feedback API request failed');
    }

    const feedback: FeedbackResponse = await response.json();
    return feedback;
  } catch (error) {
    console.error('Error getting AI feedback:', error);
    return {
      summary: "피드백 생성 중 오류가 발생했습니다.",
      strengths: [],
      areasForImprovement: [],
      recommendations: ["현재 학습 데이터를 분석할 수 없습니다. 잠시 후 다시 시도해주세요."]
    };
  }
}; 