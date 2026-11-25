export interface User {
  id: string;
  email: string;
  name: string;
  level: string;
  native_language: string;
}

export interface Scenario {
  id: string;
  title: string;
  category: string;
  difficulty: 'Foundational' | 'Fluid' | 'High Stakes';
  user_level: string;
  context: string;
  objective: string;
  ai_character_name: string;
  ai_character_role: string;
  ai_character_avatar?: string;
  ai_character_personality: string;
  initial_message: string;
  complication_triggers: Array<{
    turn: number;
    type: string;
    announcement: string;
    ai_reaction: string;
  }>;
  is_custom?: number;
}

export interface Message {
  id: string;
  session_id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  audio_duration?: number;
  timestamp?: string;
  complication_alert?: string;
}

export interface HeatmapPoint {
  turn: number;
  userSnippet: string;
  clarityScore: number;
  confidenceScore: number;
  persuasionScore: number;
  fluencyScore: number;
  highlightNote: string;
}

export interface CorrectionItem {
  id: string;
  originalText: string;
  issueType: 'grammar' | 'vocabulary' | 'filler' | 'unnatural_phrasing' | 'persuasion';
  issueDescription: string;
  betterVersion: string;
  whyExplanation: string;
}

export interface EvaluationResult {
  id: string;
  sessionId: string;
  userId: string;
  overallScore: number;
  grammarScore: number;
  vocabularyScore: number;
  fluencyScore: number;
  naturalnessScore: number;
  confidenceScore: number;
  persuasionScore: number;
  coherenceScore: number;
  strongestMoment: string;
  biggestOpportunity: string;
  timelineHeatmap: HeatmapPoint[];
  corrections: CorrectionItem[];
  summary: string;
  createdAt: string;
}

export interface CommunicationDna {
  userId: string;
  overallRating: number;
  strengths: string[];
  weaknesses: string[];
  recurringGrammar: Array<{ mistake: string; count: number; example: string }>;
  repeatedVocabulary: Array<{ word: string; count: number; suggestion: string }>;
  fillerWords: Array<{ filler: string; count: number; impact: string }>;
  naturalnessIndex: number;
  thinkInEnglishScore: number;
  totalSessions: number;
  totalWordsSpoken: number;
}

export interface DashboardAnalytics {
  overallScore: number;
  cefrLevel: string;
  sessionsCompleted: number;
  wordsSpoken: number;
  radarScores: {
    grammar: number;
    vocabulary: number;
    fluency: number;
    naturalness: number;
    confidence: number;
    persuasion: number;
  };
  progressHistory: Array<{
    date: string;
    scenarioTitle: string;
    score: number;
  }>;
  recentSessions: Array<{
    id: string;
    scenarioId: string;
    scenarioTitle: string;
    category: string;
    difficulty: string;
    score: number;
    date: string;
    status: string;
  }>;
  dnaSummary: {
    strengths: string[];
    weaknesses: string[];
    primaryWeakness: string;
    recurringMistakeCount: number;
    fillerWordDensity: string;
  };
  adaptiveRecommendation: {
    id: string;
    targetWeakness: string;
    recommendedScenarioId: string;
    recommendedScenarioTitle: string;
    rationale: string;
  };
  aiInsight: string;
}
