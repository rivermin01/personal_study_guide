export interface StudySession {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number; // Total study duration
  subject: string;
  breaks: Break[];
  focusScore: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  energy: number; // 1-5 scale
  productivity: number; // 1-5 scale
  studySegments: StudySegment[]; // New field for study segments
  breakSegments: BreakSegment[]; // New field for break segments
}

export interface StudySegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  segmentNumber: number;
}

export interface BreakSegment {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  segmentNumber: number;
}

export interface Break {
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
}

export interface TimerSettings {
  studyDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
}

export interface StudyAnalytics {
  bestTimeOfDay: string;
  recommendedStudyDuration: number;
  recommendedBreakDuration: number;
  productivityScore: number;
  focusScore: number;
  totalStudyTime: number;
  averageSessionDuration: number;
  mlConfidence: number;  // ML 모델의 신뢰도 (0~1)
  sessions: StudySession[];
}

export interface MLPrediction {
  duration: number;
  break_time: number;
  confidence: number;
}

export interface MLRequest {
  currentHour: number;
  dayOfWeek: number;
  score?: number;
  duration?: number;
  breakTime?: number;
  // trainingData?: Array<{
  //   hour: number;
  //   dayOfWeek: number;
  //   score: number;
  //   duration: number;
  //   breakTime: number;
  // }>;
}

export interface FeedbackResponse {
  summary: string;
  strengths: string[];
  areasForImprovement: string[];
  recommendations: string[];
} 