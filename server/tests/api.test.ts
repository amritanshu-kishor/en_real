import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { AuthService } from '../services/authService';
import { ScenarioService } from '../services/scenarioService';
import { ConversationService } from '../services/conversationService';
import { EvaluationService } from '../services/evaluationService';

describe('AI ENGLISH REALITY Core Engine Tests', () => {
  let guestUser: any;
  let testScenario: any;
  let testSessionId: string;

  beforeAll(() => {
    guestUser = AuthService.getOrCreateGuest('Test Pilot');
    const scenarios = ScenarioService.getAllScenarios();
    testScenario = scenarios[0];
  });

  it('1. GET /api/health should return online status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.product).toBe('AI ENGLISH REALITY');
  });

  it('2. GET /api/scenarios should return populated real-world scenarios', async () => {
    const res = await request(app).get('/api/scenarios');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.scenarios.length).toBeGreaterThanOrEqual(5);
    const airport = res.body.scenarios.find((s: any) => s.id === 'scen_airport_crisis');
    expect(airport).toBeDefined();
    expect(airport.complication_triggers.length).toBeGreaterThan(0);
  });

  it('3. Dynamic Scenario Generation should produce context and complications', async () => {
    const res = await request(app)
      .post('/api/scenarios/generate')
      .send({
        situation: 'You are disputing an incorrect $450 roaming charge with a telecom supervisor.',
        difficulty: 'High Stakes',
        character_role: 'Billing Escalations Director',
        weakness_target: 'Persuasive Evidence'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.scenario.title).toBeDefined();
    expect(res.body.scenario.ai_character_role).toBe('Billing Escalations Director');
  });

  it('4. Conversation flow: start session, process user turn with dynamic complication', async () => {
    // Start session
    const startRes = await request(app)
      .post('/api/conversation/start')
      .send({
        userId: guestUser.id,
        scenarioId: testScenario.id
      });

    expect(startRes.status).toBe(200);
    expect(startRes.body.session.id).toBeDefined();
    testSessionId = startRes.body.session.id;

    // Turn 1
    const turn1Res = await request(app)
      .post('/api/conversation/turn')
      .send({
        sessionId: testSessionId,
        userInput: 'Good evening. I understand you are overwhelmed, but my connecting flight is critical. I have my ticket confirmation right here.',
        audioDuration: 4.2
      });

    expect(turn1Res.status).toBe(200);
    expect(turn1Res.body.userMessage.content).toContain('Good evening');
    expect(turn1Res.body.aiMessage.content).toBeDefined();

    // Turn 2 with non-native phrase to test linguistic detection
    const turn2Res = await request(app)
      .post('/api/conversation/turn')
      .send({
        sessionId: testSessionId,
        userInput: 'Um, actually, I am agree that this weather is bad, but please revert back with the standby ticket because I must attend my meeting.',
        audioDuration: 5.1
      });

    expect(turn2Res.status).toBe(200);
    expect(turn2Res.body.aiMessage).toBeDefined();
  });

  it('5. Linguistic Evaluation: detects real errors and generates actionable corrections', async () => {
    const evalRes = await request(app).get(`/api/evaluation/${testSessionId}`);

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.success).toBe(true);
    const ev = evalRes.body.evaluation;
    expect(ev.overallScore).toBeGreaterThan(0);
    expect(ev.timelineHeatmap.length).toBeGreaterThanOrEqual(2);
    expect(ev.corrections.length).toBeGreaterThan(0);

    // Verify evidence-based feedback fields
    const firstCorrection = ev.corrections[0];
    expect(firstCorrection.originalText).toBeDefined();
    expect(firstCorrection.issueDescription).toBeDefined();
    expect(firstCorrection.betterVersion).toBeDefined();
    expect(firstCorrection.whyExplanation).toBeDefined();
  });

  it('6. Communication Command Center Analytics & DNA Persistence', async () => {
    const analyticsRes = await request(app).get(`/api/analytics/dashboard?userId=${guestUser.id}`);
    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.analytics.overallScore).toBeGreaterThan(0);
    expect(analyticsRes.body.analytics.radarScores.grammar).toBeDefined();
    expect(analyticsRes.body.analytics.adaptiveRecommendation).toBeDefined();
  });

  it('7. Multi-User Isolation & User Profiles', async () => {
    const usersRes = await request(app).get('/api/auth/users');
    expect(usersRes.status).toBe(200);
    expect(usersRes.body.success).toBe(true);
    expect(usersRes.body.users.length).toBeGreaterThanOrEqual(5);

    const sarahRes = await request(app).get('/api/dna?userId=usr_sarah_chen');
    const carlosRes = await request(app).get('/api/dna?userId=usr_carlos_mendes');

    expect(sarahRes.status).toBe(200);
    expect(carlosRes.status).toBe(200);
    // Verified user isolation: distinct profiles and ratings
    expect(sarahRes.body.dna.userId).toBe('usr_sarah_chen');
    expect(carlosRes.body.dna.userId).toBe('usr_carlos_mendes');
    expect(sarahRes.body.dna.overallRating).not.toEqual(carlosRes.body.dna.overallRating);

    // Test header-based user switching for dashboard and DNA
    const kenjiHeaderDna = await request(app).get('/api/dna').set('x-user-id', 'usr_kenji_sato');
    expect(kenjiHeaderDna.status).toBe(200);
    expect(kenjiHeaderDna.body.dna.userId).toBe('usr_kenji_sato');

    const sarahAnalytics = await request(app).get('/api/analytics/dashboard').set('x-user-id', 'usr_sarah_chen');
    const kenjiAnalytics = await request(app).get('/api/analytics/dashboard').set('x-user-id', 'usr_kenji_sato');
    expect(sarahAnalytics.status).toBe(200);
    expect(kenjiAnalytics.status).toBe(200);
    expect(sarahAnalytics.body.analytics.progressHistory.length).toBeGreaterThan(0);
    expect(kenjiAnalytics.body.analytics.progressHistory.length).toBeGreaterThan(0);
    expect(sarahAnalytics.body.analytics.overallScore).not.toEqual(kenjiAnalytics.body.analytics.overallScore);
  });

  it('8. Think in English: detects translation traps and collocations', async () => {
    const auditRes = await request(app)
      .post('/api/modes/think-in-english/audit')
      .send({ text: 'I am agree that we need to discuss about the budget.' });

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.result.detectedMistakes.length).toBeGreaterThan(0);
    expect(auditRes.body.result.naturalnessScore).toBeLessThan(100);
    expect(auditRes.body.result.better).toBeDefined();
  });

  it('9. Debate Arena: processes turn with rhetorical feedback and evaluates debate', async () => {
    // Stage 1
    const turnRes = await request(app)
      .post('/api/modes/debate/turn')
      .send({
        stage: 1,
        userArgument: 'Autonomous AI algorithms lack moral consciousness and internal intentionality, making personhood legally absurd.',
        motion: 'This House Would Extend Legal Personhood to Autonomous AI'
      });

    expect(turnRes.status).toBe(200);
    expect(turnRes.body.success).toBe(true);
    expect(turnRes.body.result.sessionId).toBeDefined();
    expect(turnRes.body.result.aiRebuttal).toBeDefined();
    expect(turnRes.body.result.nextStage).toBe(3);

    const debateSessionId = turnRes.body.result.sessionId;

    // Evaluate debate
    const evalRes = await request(app)
      .post('/api/modes/debate/evaluate')
      .send({ sessionId: debateSessionId });

    expect(evalRes.status).toBe(200);
    expect(evalRes.body.success).toBe(true);
    expect(evalRes.body.evaluation.overallScore).toBeGreaterThan(0);
    expect(evalRes.body.evaluation.verdict).toBeDefined();
  });

  it('10. Presentation Coach: calculates real pacing, WPM, and cadence verdict', async () => {
    const presRes = await request(app)
      .post('/api/modes/presentation/evaluate')
      .send({
        spokenTranscript: 'Good morning everyone. Today I want to walk you through our product architecture, our customer acquisition efficiency, and our five year trajectory.',
        durationSeconds: 15,
        slidesCovered: 3,
        fillerCount: 1,
        isAudioAnalyzed: true
      });

    expect(presRes.status).toBe(200);
    expect(presRes.body.success).toBe(true);
    const result = presRes.body.result;
    expect(result.wpm).toBeGreaterThan(0);
    expect(result.overallScore).toBeGreaterThan(0);
    expect(result.cadenceVerdict).toBeDefined();
    expect(result.keyStrengths.length).toBeGreaterThan(0);
  });
});
