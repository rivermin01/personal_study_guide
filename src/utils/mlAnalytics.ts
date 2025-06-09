import { StudySession } from '../types/timer';

interface MLPrediction {
  predictedDuration: number;
  predictedBreakTime: number;
  confidence: number;
}

const ML_API_URL = 'http://localhost:5001/predict';

export const predictOptimalStudyPattern = async (
  sessions: StudySession[],
  currentHour: number,
): Promise<MLPrediction> => {
  try {
    // 데이터 전처리
    const trainingData = sessions.map(session => ({
      hour: new Date(session.startTime).getHours(),
      studySegments: session.studySegments,
      breakSegments: session.breakSegments,
      score: session.focusScore,
      dayOfWeek: new Date(session.startTime).getDay(),
    }));

    // API 호출
    const response = await fetch(ML_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainingData,
        currentHour,
        dayOfWeek: new Date().getDay()
      }),
    });

    if (!response.ok) {
      throw new Error('ML API request failed');
    }

    const prediction = await response.json();
    
    return {
      predictedDuration: prediction.duration,
      predictedBreakTime: prediction.break_time,
      confidence: prediction.confidence,
    };
  } catch (error) {
    console.error('ML prediction error:', error);
    // 기본값 반환
    return {
      predictedDuration: 25 * 60,
      predictedBreakTime: 5 * 60,
      confidence: 0,
    };
  }
}; 