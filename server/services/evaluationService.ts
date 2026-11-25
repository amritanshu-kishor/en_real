import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService, Message } from './conversationService';
import { ScenarioService } from './scenarioService';
import { PersonalizationService } from './personalizationService';

export interface CorrectionItem {
  id: string;
  originalText: string;
  issueType: 'grammar' | 'vocabulary' | 'filler' | 'unnatural_phrasing' | 'persuasion';
  issueDescription: string;
  betterVersion: string;
  whyExplanation: string;
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

export class EvaluationService {
  // Common conversational filler word patterns
  private static FILLER_REGEX = /\b(um|umm|uh|uhh|er|like|you know|sort of|kind of|basically|actually|literally|i mean)\b/gi;

  // Unnatural phrasing / translated idiom patterns common in non-native English
  private static UNNATURAL_PATTERNS: Array<{
    regex: RegExp;
    desc: string;
    better: string;
    why: string;
  }> = [
    {
      regex: /\b(give an exam|giving an exam)\b/i,
      desc: 'Direct translation of "taking" an exam.',
      better: 'take an exam / sit for an exam',
      why: 'In standard English, students "take" or "sit for" exams; only teachers or examiners "give" exams.'
    },
    {
      regex: /\b(i am agree|i'm agree|i was agree)\b/i,
      desc: 'Grammatical error: using "agree" as an adjective instead of a verb.',
      better: 'I agree / I agreed',
      why: '"Agree" is an action verb in English, not an adjective. Say "I agree with you".'
    },
    {
      regex: /\b(open the light|close the light)\b/i,
      desc: 'Direct literal translation of electrical switch actions.',
      better: 'turn on the light / switch off the light',
      why: 'In English, circuits and electrical devices are "turned on" or "switched off", not opened/closed like doors.'
    },
    {
      regex: /\b(do a party|doing a party)\b/i,
      desc: 'Collocation mismatch with social events.',
      better: 'throw a party / host a party',
      why: 'Native English collocations use "throw", "host", or "have" a party, never "do a party".'
    },
    {
      regex: /\b(play with phone|playing with phone)\b/i,
      desc: 'Awkward phrasing for device usage.',
      better: 'browsing my phone / using my phone / on my phone',
      why: '"Play with" implies childish toy manipulation. For smartphones, use "checking my phone" or "on my phone".'
    },
    {
      regex: /\b(revert back)\b/i,
      desc: 'Redundancy / pleonasm.',
      better: 'reply / respond / get back to you',
      why: '"Revert" already contains the meaning of turning back; adding "back" is redundant. In international business English, use "reply" or "respond".'
    },
    {
      regex: /\b(pass out from college|passed out from university)\b/i,
      desc: 'Misleading idiom: "pass out" means to lose consciousness in standard English.',
      better: 'graduated from university / completed my degree',
      why: 'Saying "I passed out from college" implies fainting on campus.'
    },
    {
      regex: /\b(myself [a-z]+)\b/i,
      desc: 'Incorrect reflexive pronoun usage in introductions.',
      better: 'My name is... / I am...',
      why: 'Reflexive pronouns like "myself" require a preceding subject to reflect. Say "I am [Name]".'
    },
    {
      regex: /\b(if i was knowing|if i would know)\b/i,
      desc: 'Past counterfactual conditional mistake.',
      better: 'If I had known / Had I known',
      why: 'Third conditional requires past perfect ("had known") in the if-clause to discuss hypothetical pasts.'
    },
    {
      regex: /\b(discuss about)\b/i,
      desc: 'Preposition redundancy after transitive verb.',
      better: 'discuss / talk about',
      why: '"Discuss" is transitive and takes a direct object without the preposition "about".'
    }
  ];

  static async evaluateSession(sessionId: string, apiKey?: string): Promise<EvaluationResult> {
    const existing = db.prepare('SELECT * FROM evaluations WHERE session_id = ?').get(sessionId) as any;
    if (existing) {
      return {
        id: existing.id,
        sessionId: existing.session_id,
        userId: existing.user_id,
        overallScore: existing.overall_score,
        grammarScore: existing.grammar_score,
        vocabularyScore: existing.vocabulary_score,
        fluencyScore: existing.fluency_score,
        naturalnessScore: existing.naturalness_score,
        confidenceScore: existing.confidence_score,
        persuasionScore: existing.persuasion_score,
        coherenceScore: existing.coherence_score,
        strongestMoment: existing.strongest_moment,
        biggestOpportunity: existing.biggest_opportunity,
        timelineHeatmap: JSON.parse(existing.timeline_heatmap_json || '[]'),
        corrections: JSON.parse(existing.corrections_json || '[]'),
        summary: existing.summary,
        createdAt: existing.created_at
      };
    }

    const session = ConversationService.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const scenario = ScenarioService.getScenarioById(session.scenario_id);
    if (!scenario) {
      throw new Error(`Scenario not found`);
    }

    const messages = ConversationService.getMessages(sessionId);
    const userMessages = messages.filter(m => m.sender === 'user');

    if (userMessages.length === 0) {
      throw new Error('Cannot evaluate a session with no user communication turns');
    }

    // Step 1: Perform algorithmic linguistic audit
    const analysis = this.analyzeCommunicationCorpus(userMessages, scenario);

    // Step 2: If LLM is accessible, enrich feedback with deep generative insights
    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;
    if (resolvedApiKey) {
      try {
        const enriched = await this.enrichWithLLM(userMessages, scenario, resolvedApiKey);
        if (enriched) {
          if (enriched.corrections && enriched.corrections.length > 0) {
            analysis.corrections = [...enriched.corrections, ...analysis.corrections.slice(0, 2)];
          }
          if (enriched.strongestMoment) analysis.strongestMoment = enriched.strongestMoment;
          if (enriched.biggestOpportunity) analysis.biggestOpportunity = enriched.biggestOpportunity;
          if (enriched.summary) analysis.summary = enriched.summary;
        }
      } catch (e) {
        console.warn('Enrichment with Gemini skipped, using algorithmic NLP evidence:', e);
      }
    }

    const evalId = `eval_${uuidv4().substring(0, 8)}`;
    const timelineJson = JSON.stringify(analysis.timeline);
    const correctionsJson = JSON.stringify(analysis.corrections);

    db.prepare(`
      INSERT INTO evaluations (
        id, session_id, user_id, overall_score, grammar_score, vocabulary_score,
        fluency_score, naturalness_score, confidence_score, persuasion_score, coherence_score,
        strongest_moment, biggest_opportunity, timeline_heatmap_json, corrections_json, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      evalId,
      sessionId,
      session.user_id,
      analysis.overallScore,
      analysis.grammarScore,
      analysis.vocabularyScore,
      analysis.fluencyScore,
      analysis.naturalnessScore,
      analysis.confidenceScore,
      analysis.persuasionScore,
      analysis.coherenceScore,
      analysis.strongestMoment,
      analysis.biggestOpportunity,
      timelineJson,
      correctionsJson,
      analysis.summary
    );

    // Persist discrete mistakes into mistakes table for long-term DNA tracking
    const insertMistake = db.prepare(`
      INSERT INTO mistakes (id, session_id, user_id, original_text, issue_type, issue_description, correction, explanation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const corr of analysis.corrections) {
      insertMistake.run(
        corr.id,
        sessionId,
        session.user_id,
        corr.originalText,
        corr.issueType,
        corr.issueDescription,
        corr.betterVersion,
        corr.whyExplanation
      );
    }

    // Step 3: Trigger persistent Communication DNA & Adaptive Learning update
    PersonalizationService.updateDnaAfterSession(session.user_id, analysis);

    return {
      id: evalId,
      sessionId,
      userId: session.user_id,
      overallScore: analysis.overallScore,
      grammarScore: analysis.grammarScore,
      vocabularyScore: analysis.vocabularyScore,
      fluencyScore: analysis.fluencyScore,
      naturalnessScore: analysis.naturalnessScore,
      confidenceScore: analysis.confidenceScore,
      persuasionScore: analysis.persuasionScore,
      coherenceScore: analysis.coherenceScore,
      strongestMoment: analysis.strongestMoment,
      biggestOpportunity: analysis.biggestOpportunity,
      timelineHeatmap: analysis.timeline,
      corrections: analysis.corrections,
      summary: analysis.summary,
      createdAt: new Date().toISOString()
    };
  }

  private static analyzeCommunicationCorpus(userMessages: Message[], scenario: any) {
    const allUserText = userMessages.map(m => m.content).join(' ');
    const words = allUserText.match(/\b[A-Za-z0-9'-]+\b/g) || [];
    const totalWords = words.length;

    // 1. Lexical Diversity (Type-Token Ratio)
    const lowerWords = words.map(w => w.toLowerCase());
    const uniqueWords = new Set(lowerWords);
    const ttr = totalWords > 0 ? uniqueWords.size / totalWords : 0;
    // TTR normalized to 0-100: typically 0.45 - 0.75 is normal in speech
    let vocabScore = Math.min(96, Math.max(55, Math.round(ttr * 115)));

    // Bonus for advanced executive/diplomatic vocabulary
    const advancedLexicon = ['consequently', 'furthermore', 'nevertheless', 'specifically', 'compromise', 'alternative', 'unprecedented', 'priority', 'feasibility', 'reconcile', 'mitigate', 'benchmark', 'indispensable', 'concur'];
    const advancedUsed = advancedLexicon.filter(term => lowerWords.includes(term)).length;
    vocabScore = Math.min(98, vocabScore + advancedUsed * 3);

    // 2. Filler words analysis
    const fillerMatches = allUserText.match(this.FILLER_REGEX) || [];
    const fillerDensity = totalWords > 0 ? (fillerMatches.length / totalWords) * 100 : 0;
    let fluencyScore = Math.max(50, Math.min(95, Math.round(92 - fillerDensity * 6)));

    // 3. Grammar & Naturalness via rule checks
    const corrections: CorrectionItem[] = [];

    // Check unnatural patterns
    for (const pat of this.UNNATURAL_PATTERNS) {
      const match = allUserText.match(pat.regex);
      if (match) {
        corrections.push({
          id: `corr_${uuidv4().substring(0, 6)}`,
          originalText: match[0],
          issueType: 'unnatural_phrasing',
          issueDescription: pat.desc,
          betterVersion: pat.better,
          whyExplanation: pat.why
        });
      }
    }

    // Check repeated fillers
    const fillerCounts: Record<string, number> = {};
    for (const f of fillerMatches) {
      const low = f.toLowerCase();
      fillerCounts[low] = (fillerCounts[low] || 0) + 1;
    }
    for (const [fWord, count] of Object.entries(fillerCounts)) {
      if (count >= 2) {
        corrections.push({
          id: `corr_${uuidv4().substring(0, 6)}`,
          originalText: `Repeated filler: "${fWord}" (${count} times)`,
          issueType: 'filler',
          issueDescription: `High conversational reliance on verbal hesitation word "${fWord}".`,
          betterVersion: 'Deliberate micro-pause (silent breath) or concise transitional signposts like "Furthermore" or "To clarify".',
          whyExplanation: 'Pausing silently projects intellectual control and command of the room, whereas verbal fillers dilute message authority.'
        });
      }
    }

    // Evaluate basic grammar score
    let grammarScore = 88;
    if (corrections.some(c => c.issueType === 'grammar')) grammarScore -= 12;
    if (corrections.some(c => c.issueType === 'unnatural_phrasing')) grammarScore -= 6;
    grammarScore = Math.max(60, Math.min(96, grammarScore));

    // Naturalness score
    let naturalnessScore = Math.max(55, Math.min(95, Math.round(90 - corrections.length * 5)));

    // 4. Confidence & Persuasion
    const tentativeWords = ['maybe', 'perhaps', 'i think', 'i guess', 'sort of', 'probably', 'not sure'];
    const assertiveWords = ['confident', 'will ensure', 'propose', 'deliver', 'guarantee', 'objective', 'specifically', 'clear', 'priority'];

    const tentativeCount = tentativeWords.filter(tw => lowerWords.includes(tw)).length;
    const assertiveCount = assertiveWords.filter(aw => lowerWords.includes(aw)).length;

    let confidenceScore = Math.max(55, Math.min(96, 78 + (assertiveCount * 4) - (tentativeCount * 3)));
    let persuasionScore = Math.max(52, Math.min(97, 76 + (assertiveCount * 3) + (advancedUsed * 2)));
    let coherenceScore = Math.min(95, Math.max(65, Math.round(75 + Math.min(userMessages.length * 3, 15))));

    // If empty corrections, add a high-level nuance optimization so the user always has a rich takeaway
    if (corrections.length === 0) {
      const sampleMsg = userMessages[0].content;
      corrections.push({
        id: `corr_${uuidv4().substring(0, 6)}`,
        originalText: sampleMsg.slice(0, 60) + (sampleMsg.length > 60 ? '...' : ''),
        issueType: 'vocabulary',
        issueDescription: 'Conversational tone could be elevated with higher-register diplomatic collocations.',
        betterVersion: 'Elevate with assertive phrasing: "I propose we align on..." or "My primary concern is ensuring..."',
        whyExplanation: 'Replacing passive statements with structured diplomatic framing commands immediate respect from executive counterparts.'
      });
    }

    // Turn by turn timeline heatmap
    const timeline: HeatmapPoint[] = userMessages.map((msg, index) => {
      const turnWords = msg.content.split(/\s+/).length;
      const turnHasFiller = (msg.content.match(this.FILLER_REGEX) || []).length > 0;
      const turnClarity = Math.min(98, Math.max(65, 80 + (turnWords > 12 ? 8 : -4) - (turnHasFiller ? 8 : 0)));
      const turnConfidence = Math.min(98, Math.max(60, 78 + (turnWords > 15 ? 10 : 0)));
      const turnPersuasion = Math.min(98, Math.max(60, 75 + (turnWords > 20 ? 12 : 2)));
      const turnFluency = turnHasFiller ? 72 : 88;

      let note = `Turn ${index + 1}: Articulated position with ${turnWords} words.`;
      if (index === 0) note = 'Strong opening statement setting the negotiation baseline.';
      else if (turnHasFiller) note = 'Hesitation noted; filler words reduced flow.';
      else if (turnWords > 25) note = 'Detailed substantiation provided with good syntactic length.';

      return {
        turn: index + 1,
        userSnippet: msg.content.length > 70 ? msg.content.slice(0, 67) + '...' : msg.content,
        clarityScore: turnClarity,
        confidenceScore: turnConfidence,
        persuasionScore: turnPersuasion,
        fluencyScore: turnFluency,
        highlightNote: note
      };
    });

    // Identify strongest moment and biggest opportunity
    let strongestMoment = `In Turn ${timeline[0]?.turn || 1}, you clearly established your baseline stance under tension.`;
    if (timeline.length > 1) {
      const bestTurn = [...timeline].sort((a, b) => (b.persuasionScore + b.confidenceScore) - (a.persuasionScore + a.confidenceScore))[0];
      strongestMoment = `Turn ${bestTurn.turn}: "${bestTurn.userSnippet}" demonstrated peak persuasive authority and syntactic coherence.`;
    }

    const biggestOpportunity = corrections[0]
      ? `Eliminate "${corrections[0].originalText}" — ${corrections[0].whyExplanation}`
      : 'Maintain steady speech cadence when the counterpart introduces unexpected complications.';

    const overallScore = Math.round(
      (grammarScore * 0.2) +
      (vocabScore * 0.15) +
      (fluencyScore * 0.15) +
      (naturalnessScore * 0.15) +
      (confidenceScore * 0.15) +
      (persuasionScore * 0.1) +
      (coherenceScore * 0.1)
    );

    const summary = `You completed the '${scenario.title}' simulation across ${userMessages.length} communication turns. Your composure and persuasive drive were strong, achieving an overall score of ${overallScore}/100. Key focus areas remain refining native collocations and eliminating verbal fillers during sudden friction points.`;

    return {
      overallScore,
      grammarScore,
      vocabularyScore: vocabScore,
      fluencyScore,
      naturalnessScore,
      confidenceScore,
      persuasionScore,
      coherenceScore,
      strongestMoment,
      biggestOpportunity,
      timeline,
      corrections,
      summary
    };
  }

  private static async enrichWithLLM(userMessages: Message[], scenario: any, apiKey: string) {
    const dialogTranscript = userMessages.map((m, i) => `User Turn ${i + 1}: "${m.content}"`).join('\n');
    const prompt = `You are the Lead Linguistic Examiner for 'AI English Reality'.
Analyze this user's English communication in the following simulation:
Scenario: ${scenario.title} (${scenario.difficulty})
Objective: ${scenario.objective}
AI Character: ${scenario.ai_character_name} (${scenario.ai_character_role})

User's exact spoken words:
${dialogTranscript}

Provide an authentic, highly detailed, rigorous linguistic evaluation. Look for actual grammatical slips, filler words, awkward translations, or missed persuasive opportunities.
Return ONLY valid JSON matching this schema:
{
  "summary": "2 sentences summarizing real performance strengths and linguistic friction",
  "strongestMoment": "Quote the best user sentence and explain why it was effective",
  "biggestOpportunity": "Pinpoint the biggest leverage point for improvement",
  "corrections": [
    {
      "id": "corr_llm_1",
      "originalText": "Exact quote of what user said",
      "issueType": "grammar | vocabulary | filler | unnatural_phrasing | persuasion",
      "issueDescription": "Precise diagnosis of what is incorrect or sub-optimal",
      "betterVersion": "How a fluent native or executive would phrase it",
      "whyExplanation": "Clear rationale explaining linguistic rule or nuance"
    }
  ]
}`;

    const callGemini = async (model: string) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        clearTimeout(timer);
        if (!res.ok) return null;
        const data = await res.json();
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) {
        clearTimeout(timer);
        return null;
      }
    };

    let result = await callGemini('gemini-2.0-flash');
    if (!result) {
      result = await callGemini('gemini-1.5-flash');
    }
    return result;
  }
}
