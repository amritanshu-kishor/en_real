import {
  User,
  Scenario,
  Message,
  EvaluationResult,
  CommunicationDna,
  DashboardAnalytics
} from '../types';

export const API_BASE = '/api';

// ─── User Session Management ──────────────────────────────────────────────────

export function getStoredApiKey(): string {
  return localStorage.getItem('reality_ai_api_key') || '';
}

export function setStoredApiKey(key: string) {
  if (key) {
    localStorage.setItem('reality_ai_api_key', key);
  } else {
    localStorage.removeItem('reality_ai_api_key');
  }
}

export function getActiveUserId(): string {
  return localStorage.getItem('reality_active_user_id') || 'usr_sarah_chen';
}

export function setActiveUserId(userId: string) {
  localStorage.setItem('reality_active_user_id', userId);
}

// ─── Core HTTP Request Helper ─────────────────────────────────────────────────

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getStoredApiKey();
  const userId = getActiveUserId();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (apiKey) {
    headers.set('x-api-key', apiKey);
  }
  if (userId) {
    headers.set('x-user-id', userId);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data;
}

export const ApiService = {
  // ─── Server & Environment Configuration ───────────────────────────────────

  async getServerConfig(): Promise<{
    success: boolean;
    hasGeminiKey: boolean;
    engine: string;
    voiceEngine: string;
    envConfigured: boolean;
  }> {
    return request('/config');
  },

  // ─── Auth / User Management ───────────────────────────────────────────────

  async getAllUsers(): Promise<User[]> {
    const res = await request<{ success: boolean; users: User[] }>('/auth/users');
    return res.users;
  },

  async getCurrentUser(): Promise<User> {
    const res = await request<{ success: boolean; user: User }>('/auth/me');
    return res.user;
  },

  async setLevel(userId: string, level: string): Promise<void> {
    await request('/auth/level', {
      method: 'PATCH',
      body: JSON.stringify({ userId, level })
    });
  },

  // ─── Scenarios ────────────────────────────────────────────────────────────

  async getScenarios(filters?: { category?: string; difficulty?: string }): Promise<Scenario[]> {
    const query = new URLSearchParams();
    if (filters?.category) query.set('category', filters.category);
    if (filters?.difficulty) query.set('difficulty', filters.difficulty);
    const res = await request<{ success: boolean; scenarios: Scenario[] }>(`/scenarios?${query.toString()}`);
    return res.scenarios;
  },

  async getScenarioById(id: string): Promise<Scenario> {
    const res = await request<{ success: boolean; scenario: Scenario }>(`/scenarios/${id}`);
    return res.scenario;
  },

  async generateCustomScenario(params: {
    situation: string;
    difficulty?: string;
    user_level?: string;
    objective?: string;
    character_role?: string;
    weakness_target?: string;
  }): Promise<Scenario> {
    const res = await request<{ success: boolean; scenario: Scenario }>('/scenarios/generate', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        apiKey: getStoredApiKey()
      })
    });
    return res.scenario;
  },

  // ─── Conversation ─────────────────────────────────────────────────────────

  async startSession(scenarioId: string, mode = 'simulation'): Promise<{ session: any; initialMessage: Message }> {
    return request('/conversation/start', {
      method: 'POST',
      body: JSON.stringify({ scenarioId, mode })
    });
  },

  async getMessages(sessionId: string): Promise<{ session: any; messages: Message[] }> {
    return request(`/conversation/${sessionId}/messages`);
  },

  async sendTurn(params: {
    sessionId: string;
    userInput: string;
    audioDuration?: number;
  }): Promise<{ userMessage: Message; aiMessage: Message; complicationAlert?: string }> {
    return request('/conversation/turn', {
      method: 'POST',
      body: JSON.stringify({
        ...params,
        apiKey: getStoredApiKey()
      })
    });
  },

  async endSession(sessionId: string): Promise<any> {
    return request(`/conversation/${sessionId}/end`, {
      method: 'POST'
    });
  },

  // ─── Evaluation ───────────────────────────────────────────────────────────

  async getEvaluation(sessionId: string): Promise<EvaluationResult> {
    const res = await request<{ success: boolean; evaluation: EvaluationResult }>(`/evaluation/${sessionId}`);
    return res.evaluation;
  },

  // ─── DNA & Analytics ──────────────────────────────────────────────────────

  async getDna(userId = getActiveUserId()): Promise<{ dna: CommunicationDna; recommendation: any }> {
    return request(`/dna?userId=${userId}`);
  },

  async getDashboardAnalytics(userId = getActiveUserId()): Promise<DashboardAnalytics> {
    const res = await request<{ success: boolean; analytics: DashboardAnalytics }>(`/analytics/dashboard?userId=${userId}`);
    return res.analytics;
  },

  // ─── Think in English ─────────────────────────────────────────────────────

  async auditThinkInEnglish(text: string): Promise<{
    id: string;
    matched: string;
    category: string;
    unnatural: string;
    better: string;
    why: string;
    isStandard: boolean;
    naturalnessScore: number;
    detectedMistakes: Array<{
      phrase: string;
      issue: string;
      correction: string;
      rationale: string;
    }>;
  }> {
    const res = await request<{ success: boolean; result: any }>('/modes/think-in-english/audit', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    return res.result;
  },

  // ─── Debate Arena ─────────────────────────────────────────────────────────

  async sendDebateTurn(params: {
    sessionId?: string;
    stage: number;
    userArgument: string;
    motion?: string;
  }): Promise<{
    sessionId: string;
    aiRebuttal: string;
    stageName: string;
    nextStage: number;
    detectedPremise: string;
    strengthAssessment: string;
  }> {
    const res = await request<{ success: boolean; result: any }>('/modes/debate/turn', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.result;
  },

  async evaluateDebate(sessionId: string): Promise<{
    id: string;
    sessionId: string;
    overallScore: number;
    motionResult: string;
    oratoryRating: number;
    logicConsistency: number;
    rebuttalAgility: number;
    persuasivePower: number;
    verdict: string;
    keyStrengths: string[];
    improvementRecommendations: string[];
  }> {
    const res = await request<{ success: boolean; evaluation: any }>('/modes/debate/evaluate', {
      method: 'POST',
      body: JSON.stringify({ sessionId })
    });
    return res.evaluation;
  },

  // ─── Presentation Coach ───────────────────────────────────────────────────

  async evaluatePresentation(params: {
    spokenTranscript: string;
    durationSeconds: number;
    slidesCovered: number;
    fillerCount: number;
    isAudioAnalyzed?: boolean;
  }): Promise<{
    id: string;
    sessionId: string;
    overallScore: number;
    wordsSpoken: number;
    durationSeconds: number;
    wpm: number;
    fillerCount: number;
    pacingScore: number;
    fluencyScore: number;
    structureScore: number;
    cadenceVerdict: string;
    isAudioAnalyzed: boolean;
    keyStrengths: string[];
    improvementRecommendations: string[];
  }> {
    const res = await request<{ success: boolean; result: any }>('/modes/presentation/evaluate', {
      method: 'POST',
      body: JSON.stringify(params)
    });
    return res.result;
  }
};
