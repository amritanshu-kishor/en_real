import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

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
  updatedAt: string;
}

export interface AdaptiveRecommendation {
  id: string;
  userId: string;
  sessionId?: string;
  targetWeakness: string;
  recommendedScenarioId: string;
  recommendedScenarioTitle: string;
  rationale: string;
  createdAt: string;
}

export class PersonalizationService {
  static getDna(userId: string): CommunicationDna | null {
    const row = db.prepare('SELECT * FROM communication_dna WHERE user_id = ?').get(userId) as any;
    if (!row) return null;

    return {
      userId: row.user_id,
      overallRating: row.overall_rating,
      strengths: JSON.parse(row.strengths_json || '[]'),
      weaknesses: JSON.parse(row.weaknesses_json || '[]'),
      recurringGrammar: JSON.parse(row.recurring_grammar_json || '[]'),
      repeatedVocabulary: JSON.parse(row.repeated_vocabulary_json || '[]'),
      fillerWords: JSON.parse(row.filler_words_json || '[]'),
      naturalnessIndex: row.naturalness_index,
      thinkInEnglishScore: row.think_in_english_score,
      totalSessions: row.total_sessions,
      totalWordsSpoken: row.total_words_spoken,
      updatedAt: row.updated_at
    };
  }

  static updateDnaAfterSession(userId: string, evaluation: any) {
    const existing = this.getDna(userId);

    // Compute updated moving average rating
    const currentRating = existing?.overallRating || 75;
    const newRating = Math.round(((currentRating * 0.7) + (evaluation.overallScore * 0.3)) * 10) / 10;

    const totalSessions = (existing?.totalSessions || 0) + 1;
    const sessionWords = evaluation.timeline?.reduce((acc: number, t: any) => acc + (t.userSnippet?.split(' ').length || 10), 0) || 50;
    const totalWords = (existing?.totalWordsSpoken || 0) + sessionWords;

    // Build or update recurring grammar mistakes
    const recurringGrammar = existing?.recurringGrammar || [];
    for (const corr of evaluation.corrections || []) {
      if (corr.issueType === 'grammar' || corr.issueType === 'unnatural_phrasing') {
        const found = recurringGrammar.find(g => g.mistake.toLowerCase() === corr.issueDescription.toLowerCase());
        if (found) {
          found.count += 1;
          found.example = corr.originalText;
        } else {
          recurringGrammar.push({
            mistake: corr.issueDescription,
            count: 1,
            example: corr.originalText
          });
        }
      }
    }

    // Build or update filler words
    const fillerWords = existing?.fillerWords || [];
    for (const corr of evaluation.corrections || []) {
      if (corr.issueType === 'filler') {
        const fillerName = corr.originalText;
        const found = fillerWords.find(f => f.filler.toLowerCase() === fillerName.toLowerCase());
        if (found) {
          found.count += 1;
        } else {
          fillerWords.push({
            filler: fillerName,
            count: 1,
            impact: 'Medium'
          });
        }
      }
    }

    // Adapt naturalness & think-in-english index
    const naturalnessIndex = Math.round((((existing?.naturalnessIndex || 70) * 0.7) + (evaluation.naturalnessScore * 0.3)) * 10) / 10;
    const thinkInEnglishScore = Math.round((((existing?.thinkInEnglishScore || 70) * 0.7) + (evaluation.coherenceScore * 0.3)) * 10) / 10;

    // Dynamic Strengths & Weaknesses synthesis
    const strengths = existing?.strengths || [];
    if (evaluation.confidenceScore >= 80 && !strengths.includes('High assertiveness under scrutiny')) {
      strengths.unshift('High assertiveness under scrutiny');
    }
    if (evaluation.vocabularyScore >= 80 && !strengths.includes('Advanced diplomatic vocabulary register')) {
      strengths.unshift('Advanced diplomatic vocabulary register');
    }

    const weaknesses = existing?.weaknesses || [];
    if (evaluation.fluencyScore < 75) {
      const w = 'Hesitation and pauses when answering abrupt counter-questions';
      if (!weaknesses.includes(w)) weaknesses.unshift(w);
    }
    if (evaluation.persuasionScore < 75) {
      const w = 'Requires stronger quantitative leverage during negotiations';
      if (!weaknesses.includes(w)) weaknesses.unshift(w);
    }
    if (evaluation.naturalnessScore < 75) {
      const w = 'Prone to literal translations of native idioms under stress';
      if (!weaknesses.includes(w)) weaknesses.unshift(w);
    }

    db.prepare(`
      INSERT INTO communication_dna (
        user_id, overall_rating, strengths_json, weaknesses_json,
        recurring_grammar_json, repeated_vocabulary_json, filler_words_json,
        naturalness_index, think_in_english_score, total_sessions, total_words_spoken, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        overall_rating = excluded.overall_rating,
        strengths_json = excluded.strengths_json,
        weaknesses_json = excluded.weaknesses_json,
        recurring_grammar_json = excluded.recurring_grammar_json,
        repeated_vocabulary_json = excluded.repeated_vocabulary_json,
        filler_words_json = excluded.filler_words_json,
        naturalness_index = excluded.naturalness_index,
        think_in_english_score = excluded.think_in_english_score,
        total_sessions = excluded.total_sessions,
        total_words_spoken = excluded.total_words_spoken,
        updated_at = CURRENT_TIMESTAMP
    `).run(
      userId,
      newRating,
      JSON.stringify(strengths.slice(0, 5)),
      JSON.stringify(weaknesses.slice(0, 5)),
      JSON.stringify(recurringGrammar.slice(0, 6)),
      JSON.stringify(existing?.repeatedVocabulary || []),
      JSON.stringify(fillerWords.slice(0, 6)),
      naturalnessIndex,
      thinkInEnglishScore,
      totalSessions,
      totalWords
    );

    // Compute Adaptive Next Challenge
    this.generateAdaptiveRecommendation(userId, evaluation);
  }

  static generateAdaptiveRecommendation(userId: string, evaluation: any): AdaptiveRecommendation {
    let targetWeakness = 'General Communication Agility';
    let recScenarioId = 'scen_airport_crisis';
    let rationale = 'Sharpen spontaneous composure against volatile conversational resistance.';

    // Rule-based adaptive pathing
    if (evaluation.persuasionScore < 75) {
      targetWeakness = 'Persuasive Leverage & Assertiveness';
      recScenarioId = 'scen_salary_negotiation';
      rationale = 'Your previous score in persuasion indicates difficulty holding ground against corporate pushback. This high-stakes compensation standoff will force you to articulate structured leverage.';
    } else if (evaluation.naturalnessScore < 75) {
      targetWeakness = 'Native Collocations & "Think in English" Fluency';
      recScenarioId = 'scen_hotel_problem';
      rationale = 'Identified instances of direct native language translation. The luxury hotel dispute requires precise polite idioms and high-register diplomatic phrasing.';
    } else if (evaluation.vocabularyScore < 75) {
      targetWeakness = 'Lexical Richness & Precision';
      recScenarioId = 'scen_debate_ai_rights';
      rationale = 'Your lexical variety score was below 75. Oxford Union debate forces you to employ abstract philosophical vocabulary and structured syllogisms.';
    } else if (evaluation.fluencyScore < 75) {
      targetWeakness = 'Filler Elimination & Spontaneous Cadence';
      recScenarioId = 'scen_presentation_keynote';
      rationale = 'Detected verbal hesitation and filler words. Pitching to investors with an active timer trains deliberate silence over verbal filler.';
    } else {
      targetWeakness = 'High-Stakes Crisis Leadership';
      recScenarioId = 'scen_emergency_triage';
      rationale = 'You demonstrated strong baseline scores. The alpine medical triage will test your ability to transmit life-critical information with zero ambiguity.';
    }

    const recId = `rec_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO adaptive_recommendations (id, user_id, session_id, target_weakness, recommended_scenario_id, rationale)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(recId, userId, evaluation.sessionId, targetWeakness, recScenarioId, rationale);

    const scenario = db.prepare('SELECT title FROM scenarios WHERE id = ?').get(recScenarioId) as any;

    return {
      id: recId,
      userId,
      sessionId: evaluation.sessionId,
      targetWeakness,
      recommendedScenarioId: recScenarioId,
      recommendedScenarioTitle: scenario?.title || 'Next Adaptive Challenge',
      rationale,
      createdAt: new Date().toISOString()
    };
  }

  static getLatestRecommendation(userId: string): AdaptiveRecommendation | null {
    const row = db.prepare(`
      SELECT ar.*, s.title as scenario_title
      FROM adaptive_recommendations ar
      LEFT JOIN scenarios s ON ar.recommended_scenario_id = s.id
      WHERE ar.user_id = ?
      ORDER BY ar.created_at DESC
      LIMIT 1
    `).get(userId) as any;

    if (!row) {
      return {
        id: 'rec_initial',
        userId,
        targetWeakness: 'Dynamic Crisis Agility',
        recommendedScenarioId: 'scen_airport_crisis',
        recommendedScenarioTitle: 'Airport Gate Chaos & The Last Flight',
        rationale: 'Calibrate your communication DNA in an unpredictable, high-stakes international travel crisis.',
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: row.id,
      userId: row.user_id,
      sessionId: row.session_id,
      targetWeakness: row.target_weakness,
      recommendedScenarioId: row.recommended_scenario_id,
      recommendedScenarioTitle: row.scenario_title || 'Next Reality Challenge',
      rationale: row.rationale,
      createdAt: row.created_at
    };
  }
}
