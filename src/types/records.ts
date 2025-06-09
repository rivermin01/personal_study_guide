export interface TestRecord {
  id: string;
  userId: string;
  timestamp: number;
  personalityType: string;
  recommendation: string;
  scores: {
    extraversion: number;
    openness: number;
    conscientiousness: number;
    agreeableness: number;
    neuroticism: number;
  };
}

export interface TimerRecord {
  id: string;
  userId: string;
  startTime: number;
  endTime: number;
  duration: number; // 총 공부 시간 (밀리초)
  focusScore: number;
  subject: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  studySegments: {
    startTime: number;
    endTime: number;
    duration: number;
    segmentNumber: number;
  }[];
  breakSegments: {
    startTime: number;
    endTime: number;
    duration: number;
    segmentNumber: number;
  }[];
}

export type RecordType = 'test' | 'timer'; 