export interface TestResult {
  id?: string;
  timestamp: number;
  answers: number[];
  personalityType: string;
  scores: {
    extraversion: number;
    openness: number;
    conscientiousness: number;
    agreeableness: number;
    neuroticism: number;
  };
  recommendation: string;
} 