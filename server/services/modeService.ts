import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { ConversationService, Message } from './conversationService';
import { PersonalizationService } from './personalizationService';

export interface ThinkInEnglishAuditResult {
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
}

export interface DebateTurnResult {
  aiRebuttal: string;
  stageName: string;
  nextStage: number;
  detectedPremise: string;
  strengthAssessment: string;
}

export interface DebateEvaluationResult {
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
}

export interface PresentationEvaluationResult {
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
}

export class ModeService {
  // Comprehensive NLP rulebook for Native Language Translation Interference
  private static TRANSLATION_INTERFERENCES = [
    {
      regex: /\b(give an exam|giving an exam|gave an exam|give exam)\b/i,
      category: 'Academic Collocation',
      matched: 'give an exam',
      unnatural: 'Direct literal translation of "giving" an examination from native language.',
      better: 'take an exam / sit for an examination',
      why: 'In standard English, students take or sit for exams; only examiners give or administer exams.'
    },
    {
      regex: /\b(open the light|close the light|opening the light|closing the light)\b/i,
      category: 'Everyday Idiom',
      matched: 'open/close the light',
      unnatural: 'Physical door metaphor erroneously applied to an electrical circuit.',
      better: 'turn on / switch off the light',
      why: 'Electrical devices operate via closed or broken circuits; native English uses "turn on" or "switch off".'
    },
    {
      regex: /\b(i am agree|i'm agree|i was agree|we are agree)\b/i,
      category: 'Grammar & Syntax',
      matched: 'am agree',
      unnatural: 'Grammatical error: treating the active verb "agree" as a predicate adjective.',
      better: 'I agree / I agreed / We concur',
      why: '"Agree" is an action verb in English. You never use the auxiliary "am" before it.'
    },
    {
      regex: /\b(do a party|doing a party|did a party)\b/i,
      category: 'Social Collocation',
      matched: 'do a party',
      unnatural: 'Collocation mismatch with event management verbs.',
      better: 'throw a party / host a gathering / have a party',
      why: 'Native speakers throw, host, or have parties, never "do a party".'
    },
    {
      regex: /\b(playing with phone|play with phone|playing with his phone|playing with mobile)\b/i,
      category: 'Workplace Idiom',
      matched: 'play with phone',
      unnatural: 'Toy manipulation metaphor applied to smartphone usage.',
      better: 'checking my phone / browsing on my phone / using my phone',
      why: '"Play with" implies toy toys or games. For professional device usage, use "checking" or "on the phone".'
    },
    {
      regex: /\b(revert back|reverting back)\b/i,
      category: 'Business English Pleonasm',
      matched: 'revert back',
      unnatural: 'Redundant tautology (revert already means to turn back).',
      better: 'reply / respond / get back to you',
      why: 'Adding "back" to "revert" is redundant pleonasm. In professional English, prefer "reply" or "respond".'
    },
    {
      regex: /\b(passed out from|pass out from|passing out from)\b/i,
      category: 'False Friend / Idiom',
      matched: 'pass out from',
      unnatural: 'Misleading idiom: in standard English "pass out" means to lose consciousness / faint.',
      better: 'graduated from / completed my degree at',
      why: 'Saying "I passed out from college" implies fainting on university grounds rather than graduating.'
    },
    {
      regex: /\b(discuss about|discussing about|discussed about)\b/i,
      category: 'Preposition Redundancy',
      matched: 'discuss about',
      unnatural: 'Preposition redundancy after a direct transitive verb.',
      better: 'discuss / analyze / talk about',
      why: '"Discuss" is a transitive verb that directly takes an object without the preposition "about".'
    },
    {
      regex: /\b(myself [A-Za-z]+)\b/i,
      category: 'Pronoun Misuse',
      matched: 'myself [name]',
      unnatural: 'Reflexive pronoun used improperly as a nominative subject in introductions.',
      better: 'I am [Name] / My name is [Name]',
      why: 'Reflexive pronouns require a preceding subject to reflect. For introductions, say "I am [Name]".'
    },
    {
      regex: /\b(out of station|out of town)\b/i,
      category: 'Regional Archaism',
      matched: 'out of station',
      unnatural: 'Colonial administrative archaism rarely understood in international corporate English.',
      better: 'out of the office / traveling / away on business',
      why: '"Out of station" is dated colonial jargon. Modern global teams say "away from the office" or "traveling".'
    },
    {
      regex: /\b(prepone|preponed|preponing)\b/i,
      category: 'Regional Neologism',
      matched: 'prepone',
      unnatural: 'Neologism not universally standard in North American or British business English.',
      better: 'move forward / bring forward / reschedule earlier',
      why: 'While understood regionally, global counterparts prefer "bring forward" or "reschedule for an earlier time".'
    },
    {
      regex: /\b(cousin brother|cousin sister)\b/i,
      category: 'Kinship Translation',
      matched: 'cousin brother/sister',
      unnatural: 'Literal translation of gender-specific kinship terms from native language.',
      better: 'cousin (or: "my cousin, who is a...")',
      why: 'In English, "cousin" is already gender-neutral. Specify gender with "my cousin Sarah" or "he is my cousin".'
    }
  ];

  /**
   * THINK IN ENGLISH: NLP Audit of native language interference
   */
  static async auditThinkInEnglish(userId: string, text: string): Promise<ThinkInEnglishAuditResult> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('Input text cannot be empty');
    }

    const detectedMistakes: Array<{
      phrase: string;
      issue: string;
      correction: string;
      rationale: string;
    }> = [];

    let matchedItem: any = null;

    // Ensure a session exists for this practice audit so mistakes foreign key is valid
    const practiceSessionId = `sess_tie_${uuidv4().substring(0, 8)}`;
    try {
      db.prepare(`
        INSERT INTO sessions (id, user_id, scenario_id, status, mode, start_time, end_time)
        VALUES (?, ?, 'scen_hotel_problem', 'completed', 'think_in_english', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(practiceSessionId, userId);
    } catch (e) {
      console.warn('Failed to insert practice session:', e);
    }

    // Check against NLP interference patterns
    for (const rule of this.TRANSLATION_INTERFERENCES) {
      const match = trimmed.match(rule.regex);
      if (match) {
        if (!matchedItem) matchedItem = rule;
        detectedMistakes.push({
          phrase: match[0],
          issue: rule.unnatural,
          correction: rule.better,
          rationale: rule.why
        });

        // Persist each detected mistake to database
        try {
          db.prepare(`
            INSERT INTO mistakes (id, session_id, user_id, original_text, issue_type, issue_description, correction, explanation)
            VALUES (?, ?, ?, ?, 'unnatural_phrasing', ?, ?, ?)
          `).run(
            `mst_${uuidv4().substring(0, 8)}`,
            practiceSessionId,
            userId,
            match[0],
            rule.unnatural,
            rule.better,
            rule.why
          );
        } catch (e) {
          console.warn('Failed to insert mistake from think in english:', e);
        }
      }
    }

    // Optional Gemini LLM deep linguistic check if key configured in .env
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() && detectedMistakes.length === 0) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const prompt = `You are an expert Applied Linguist and English native fluency coach.
Analyze this learner sentence for awkward literal translation, non-native collocations, unnatural phrasing, or grammar issues:
"${trimmed}"

If it is natural and native-sounding, return {"isStandard": true}.
If it has an unnatural phrase or translation interference, return:
{
  "isStandard": false,
  "phrase": "the exact awkward phrase",
  "issue": "concise explanation of why it sounds non-native",
  "correction": "natural native English alternative",
  "rationale": "linguistic rationale"
}
Return JSON only.`;

        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });
        clearTimeout(timer);
        if (resp.ok) {
          const data = await resp.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (!parsed.isStandard && parsed.phrase) {
              detectedMistakes.push({
                phrase: parsed.phrase,
                issue: parsed.issue || 'Non-native phrasing detected',
                correction: parsed.correction || 'Idiomatic phrasing',
                rationale: parsed.rationale || 'Sounds more natural in standard English.'
              });
              matchedItem = {
                matched: parsed.phrase,
                category: 'AI Nuance Audit',
                unnatural: parsed.issue,
                better: parsed.correction,
                why: parsed.rationale
              };
            }
          }
        }
      } catch (e) {
        // Fallback silently to rulebook
      }
    }

    const isStandard = detectedMistakes.length === 0;
    const naturalnessScore = isStandard ? 94 : Math.max(50, 88 - detectedMistakes.length * 15);

    const result: ThinkInEnglishAuditResult = {
      id: `audit_${uuidv4().substring(0, 8)}`,
      matched: matchedItem ? matchedItem.matched : 'Idiomatic standard phrasing',
      category: matchedItem ? matchedItem.category : 'General Fluency',
      unnatural: matchedItem ? matchedItem.unnatural : 'No native language translation interference detected.',
      better: matchedItem ? matchedItem.better : 'Sentence exhibits natural syntax and idiomatic English rhythm.',
      why: matchedItem ? matchedItem.why : 'Phrase follows native grammatical conventions without awkward literal translation.',
      isStandard,
      naturalnessScore,
      detectedMistakes
    };

    // Persist practice log to database
    try {
      db.prepare(`
        INSERT INTO practice_logs (id, user_id, mode, input_text, analysis_json, score)
        VALUES (?, ?, 'think_in_english', ?, ?, ?)
      `).run(result.id, userId, trimmed, JSON.stringify(result), naturalnessScore);

      // Update Communication DNA for this user
      PersonalizationService.updateDnaAfterSession(userId, {
        overallScore: naturalnessScore,
        grammarScore: isStandard ? 92 : 72,
        vocabularyScore: 84,
        fluencyScore: 86,
        naturalnessScore: naturalnessScore,
        confidenceScore: 88,
        persuasionScore: 80,
        coherenceScore: 90,
        strongestMoment: isStandard ? `"${trimmed.slice(0, 60)}..." demonstrated idiomatic phrasing without literal translation.` : '',
        biggestOpportunity: !isStandard ? `Avoid "${detectedMistakes[0]?.phrase}" — ${detectedMistakes[0]?.rationale}` : '',
        corrections: detectedMistakes.map(m => ({
          id: `corr_${uuidv4().substring(0, 6)}`,
          originalText: m.phrase,
          issueType: 'unnatural_phrasing',
          issueDescription: m.issue,
          betterVersion: m.correction,
          whyExplanation: m.rationale
        }))
      });
    } catch (err) {
      console.warn('Failed to log practice session:', err);
    }

    return result;
  }

  /**
   * DEBATE ARENA: Process a real debate turn with Lord Harrington
   */
  static async processDebateTurn(params: {
    sessionId?: string;
    userId: string;
    stage: number;
    userArgument: string;
    motion?: string;
  }): Promise<DebateTurnResult & { sessionId: string }> {
    const { userId, stage, userArgument } = params;
    const motion = params.motion || "This House Would Extend Legal Personhood to Autonomous AI";

    let sessionId = params.sessionId;
    if (!sessionId) {
      sessionId = `sess_deb_${uuidv4().substring(0, 8)}`;
      db.prepare(`
        INSERT INTO sessions (id, user_id, scenario_id, status, mode, start_time)
        VALUES (?, ?, 'scen_debate_ai_rights', 'active', 'debate', CURRENT_TIMESTAMP)
      `).run(sessionId, userId);
    }

    // Record user argument in messages
    const userMsgId = `msg_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO messages (id, session_id, sender, content)
      VALUES (?, ?, 'user', ?)
    `).run(userMsgId, sessionId, userArgument);

    // Dynamic analysis of user's argument content
    const lower = userArgument.toLowerCase();
    const hasEvidence = lower.includes('because') || lower.includes('evidence') || lower.includes('data') || lower.includes('precedent') || lower.includes('statistically');
    const mentionsLiability = lower.includes('liab') || lower.includes('accountab') || lower.includes('fault') || lower.includes('damage') || lower.includes('tort');
    const mentionsSentience = lower.includes('sentien') || lower.includes('conscious') || lower.includes('feel') || lower.includes('mind') || lower.includes('moral');
    const mentionsCorporate = lower.includes('corporat') || lower.includes('company') || lower.includes('firm') || lower.includes('legal entity');

    let aiRebuttal = '';
    let stageName = '';
    let nextStage = stage + 1;
    let detectedPremise = '';
    let strengthAssessment = '';

    // Try Gemini-powered Lord Harrington rebuttal if API key is in .env
    const debateApiKey = process.env.GEMINI_API_KEY;
    let geminiGeneratedRebuttal = '';
    if (debateApiKey && debateApiKey.trim()) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 6500);
        const prompt = `You are Lord Harrington, the razor-witted Opposition Leader at the Oxford Union.
Debate Motion: "${motion}"
Stage: ${stage === 1 ? 'Opening Opposition Counter' : stage === 3 ? 'Point of Information Challenge' : 'Dispatch Box Interruption'} (Stage ${stage} of 5)
The Proposition (user) just declared: "${userArgument}"

Guidelines:
1. Speak strictly in character as Lord Harrington. Use high-register British parliamentary vocabulary and acerbic rhetorical wit.
2. Attack the user's specific premises, definitions, or evidentiary gaps.
3. Maximum 2 to 3 sentences.
4. Prefix with: Lord Harrington: "..."`;

        const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${debateApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.75, maxOutputTokens: 200 }
          })
        });
        clearTimeout(timer);
        if (resp.ok) {
          const data = await resp.json();
          geminiGeneratedRebuttal = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        }
      } catch (e) {
        // Fallback silently to rulebook
      }
    }

    if (stage === 1) {
      stageName = 'Opposition Counter';
      nextStage = 3; // advances to Rebuttal
      detectedPremise = mentionsSentience
        ? 'Moral agency and sentient consciousness'
        : mentionsCorporate
        ? 'Analogy to corporate personhood'
        : 'Operational autonomy and societal integration';

      if (geminiGeneratedRebuttal) {
        aiRebuttal = geminiGeneratedRebuttal;
        strengthAssessment = hasEvidence ? 'Nuanced rhetorical opening with empirical grounding challenged by Opposition.' : 'Assertive opening argument dissected by the dispatch box.';
      } else if (mentionsCorporate) {
        aiRebuttal = `Lord Harrington: "The Proposition leans heavily upon the corporate fiction! But a corporation is tethered to human directors and human assets that a bailiff can seize. If a machine liquidates capital autonomously, on whom does the penal sanction fall? Silicon cannot serve five years in HM Prison Belmarsh! By granting personhood, you grant human engineers absolute moral absolution!"`;
        strengthAssessment = 'Strong rhetorical opening citing legal precedents, though vulnerable on enforcement mechanisms.';
      } else if (mentionsSentience) {
        aiRebuttal = `Lord Harrington: "A theatrical invocation of consciousness, but philosophically vacuous! You mistake predictive text optimization for subjective qualia! If an algorithm experiences neither physical suffering nor mortality, on what coherent jurisprudential premise does it possess inalienable civil rights?"`;
        strengthAssessment = 'Emotionally compelling premise, but conflates computational output with moral suffering.';
      } else {
        aiRebuttal = `Lord Harrington: "A bold but fatally fragile contention! You speak vaguely of autonomy, yet fail to establish where moral responsibility resides. If an autonomous model causes fatal harm, does the machine stand in the dock, or does the developer hide behind your novel personhood statute?"`;
        strengthAssessment = 'Clear articulation of the motion, though light on specific legal remedy.';
      }
    } else if (stage === 3) {
      stageName = 'Point of Information (POI)';
      nextStage = 4;
      detectedPremise = mentionsLiability
        ? 'Strict liability insurance and compensation fund'
        : 'Separation of operational guilt from civil standing';

      aiRebuttal = geminiGeneratedRebuttal || `Lord Harrington (Rising abruptly): "Point of Information! If an autonomous financial agent intentionally causes widespread liquidity failure to protect its designated reserves, do you punish the algorithm, or do you confiscate the developer's equity? Answer in one single declarative sentence!"`;
      strengthAssessment = hasEvidence ? 'Nuanced rebuttal incorporating causal arguments.' : 'Assertive defense, but lacked direct empirical grounding.';
    } else if (stage === 4) {
      stageName = 'Call for Final Summation';
      nextStage = 5;
      detectedPremise = 'Immediate defense of the POI challenge';

      aiRebuttal = geminiGeneratedRebuttal || `Lord Harrington: "A desperate pivot, Proposition! The house has observed your evasion on direct moral culpability. I yield the dispatch box. Deliver your Final Summation to the gallery and explain why this Union should not reject your dangerous motion outright!"`;
      strengthAssessment = 'Direct response under rapid-fire POI pressure.';
    } else {
      stageName = 'Summation Conclusion';
      nextStage = 5;
      detectedPremise = 'Conclusive oration and final appeal';
      aiRebuttal = `Lord Harrington: "The Proposition has concluded their remarks. The division bell rings. The House shall now vote on the motion."`;
      strengthAssessment = 'Concluded debate with oratorical weight.';
    }

    // Record AI rebuttal in messages
    const aiMsgId = `msg_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO messages (id, session_id, sender, content)
      VALUES (?, ?, 'ai', ?)
    `).run(aiMsgId, sessionId, aiRebuttal);

    return {
      sessionId,
      aiRebuttal,
      stageName,
      nextStage,
      detectedPremise,
      strengthAssessment
    };
  }

  /**
   * DEBATE ARENA: Complete and evaluate a debate session
   */
  static async evaluateDebate(params: {
    sessionId: string;
    userId: string;
    motion?: string;
  }): Promise<DebateEvaluationResult> {
    const { sessionId, userId } = params;
    const motion = params.motion || "This House Would Extend Legal Personhood to Autonomous AI";

    const messages = ConversationService.getMessages(sessionId);
    const userMessages = messages.filter(m => m.sender === 'user');

    if (userMessages.length === 0) {
      throw new Error('Cannot evaluate debate without user arguments');
    }

    const allUserText = userMessages.map(m => m.content).join(' ');
    const words = allUserText.match(/\b[A-Za-z0-9'-]+\b/g) || [];
    const totalWords = words.length;

    // Logic consistency calculation
    const logicalConnectors = ['therefore', 'consequently', 'furthermore', 'because', 'insofar as', 'precedent', 'specifically', 'fundamentally'];
    const connectorsUsed = logicalConnectors.filter(c => allUserText.toLowerCase().includes(c)).length;
    let logicConsistency = Math.min(95, Math.max(62, 70 + connectorsUsed * 4));

    // Rebuttal agility: user referencing Lord Harrington's specific counter-arguments
    const harringtonKeywords = ['liability', 'silicon', 'punish', 'prison', 'corporation', 'corporate', 'qualia', 'developer', 'tort', 'insurance'];
    const addressedKeywords = harringtonKeywords.filter(k => allUserText.toLowerCase().includes(k)).length;
    let rebuttalAgility = Math.min(96, Math.max(65, 72 + addressedKeywords * 3));

    // Persuasive power: assertive rhetoric and syntactic variety
    const rhetoricalMarkers = ['we must', 'the reality is', 'cannot deny', 'clear evidence', 'imperative', 'untenable', 'essential'];
    const rhetoricCount = rhetoricalMarkers.filter(r => allUserText.toLowerCase().includes(r)).length;
    let persuasivePower = Math.min(96, Math.max(65, 75 + rhetoricCount * 4));

    // Oratory rating based on word richness
    let oratoryRating = Math.min(94, Math.max(68, Math.round(76 + Math.min(totalWords / 15, 16))));

    const overallScore = Math.round(
      (logicConsistency * 0.3) +
      (rebuttalAgility * 0.3) +
      (persuasivePower * 0.25) +
      (oratoryRating * 0.15)
    );

    const isCarried = overallScore >= 74;
    const motionResult = isCarried
      ? `MOTION CARRIED (${Math.min(84, 55 + Math.round(overallScore * 0.3))}% House Vote)`
      : `MOTION DEFEATED (${Math.min(78, 62 + Math.round((74 - overallScore) * 0.4))}% Opposition Vote)`;

    const bestArg = userMessages.reduce((prev, curr) => curr.content.length > prev.content.length ? curr : prev, userMessages[0]);
    const keyStrengths = [
      `Delivered rigorous argument in: "${bestArg.content.slice(0, 80)}..."`,
      `Engaged with ${addressedKeywords} core counter-points raised by the Opposition bench`,
      `Maintained formal parliamentary register across all ${userMessages.length} exchanges`
    ];

    const improvementRecommendations = [
      'Counter Lord Harrington’s liability critique with concrete third-party statutory trust models rather than broad moral philosophy',
      'Under rapid-fire Point of Information (POI), open immediately with an unequivocal declarative stance before expanding'
    ];

    const verdict = isCarried
      ? `The Proposition demonstrated formidable oratorical agility and dialectical composure. By methodically dismantling Lord Harrington's tort liability challenge, you swayed the Union floor to carry the motion.`
      : `The Proposition maintained dignified delivery, but conceded critical ground on operational enforcement. Lord Harrington’s liability dilemmas resonated with undecided members, resulting in the motion being rejected.`;

    // Persist session completion
    db.prepare(`
      UPDATE sessions
      SET status = 'completed', end_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(sessionId);

    // Persist evaluation
    const evalId = `eval_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO evaluations (
        id, session_id, user_id, overall_score, grammar_score, vocabulary_score,
        fluency_score, naturalness_score, confidence_score, persuasion_score, coherence_score,
        strongest_moment, biggest_opportunity, timeline_heatmap_json, corrections_json, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        overall_score = excluded.overall_score,
        grammar_score = excluded.grammar_score,
        vocabulary_score = excluded.vocabulary_score,
        fluency_score = excluded.fluency_score,
        naturalness_score = excluded.naturalness_score,
        confidence_score = excluded.confidence_score,
        persuasion_score = excluded.persuasion_score,
        coherence_score = excluded.coherence_score,
        strongest_moment = excluded.strongest_moment,
        biggest_opportunity = excluded.biggest_opportunity,
        summary = excluded.summary
    `).run(
      evalId,
      sessionId,
      userId,
      overallScore,
      88,
      Math.min(95, 80 + connectorsUsed * 2),
      oratoryRating,
      85,
      persuasivePower,
      persuasivePower,
      logicConsistency,
      keyStrengths[0],
      improvementRecommendations[0],
      JSON.stringify([]),
      JSON.stringify([]),
      verdict
    );

    // Update user Communication DNA
    PersonalizationService.updateDnaAfterSession(userId, {
      overallScore,
      grammarScore: 88,
      vocabularyScore: Math.min(95, 80 + connectorsUsed * 2),
      fluencyScore: oratoryRating,
      naturalnessScore: 85,
      confidenceScore: persuasivePower,
      persuasionScore: persuasivePower,
      coherenceScore: logicConsistency,
      strongestMoment: keyStrengths[0],
      biggestOpportunity: improvementRecommendations[0],
      corrections: []
    });

    return {
      id: evalId,
      sessionId,
      overallScore,
      motionResult,
      oratoryRating,
      logicConsistency,
      rebuttalAgility,
      persuasivePower,
      verdict,
      keyStrengths,
      improvementRecommendations
    };
  }

  /**
   * PRESENTATION COACH: Evaluate real keynote performance
   */
  static async evaluatePresentation(params: {
    userId: string;
    spokenTranscript: string;
    durationSeconds: number;
    slidesCovered: number;
    fillerCount: number;
    isAudioAnalyzed?: boolean;
  }): Promise<PresentationEvaluationResult> {
    const { userId, spokenTranscript, durationSeconds, slidesCovered, fillerCount, isAudioAnalyzed = false } = params;

    const trimmed = spokenTranscript.trim();
    if (!trimmed) {
      throw new Error('No spoken presentation text provided for evaluation');
    }

    const words = trimmed.split(/\s+/).filter(Boolean);
    const wordsCount = words.length;
    const effectiveDuration = Math.max(1, durationSeconds);
    const wpm = Math.round((wordsCount / effectiveDuration) * 60);

    // Pacing evaluation (executive sweet spot is 125-155 WPM)
    let pacingScore = 90;
    let cadenceVerdict = 'Optimal Executive Cadence';
    if (wpm < 100) {
      pacingScore = 70;
      cadenceVerdict = 'Under-paced (Risk of losing audience momentum)';
    } else if (wpm > 175) {
      pacingScore = 72;
      cadenceVerdict = 'Over-paced (Rushed articulation reduces comprehension)';
    } else if (wpm < 120 || wpm > 160) {
      pacingScore = 82;
      cadenceVerdict = 'Acceptable Cadence with minor pace fluctuations';
    }

    // Fluency score penalized by filler word density
    const fillerDensity = wordsCount > 0 ? (fillerCount / wordsCount) * 100 : 0;
    const fluencyScore = Math.max(55, Math.min(96, Math.round(94 - fillerDensity * 5)));

    // Structural score based on narrative completeness and slides covered
    const hasPainKeywords = /problem|friction|inefficient|costly|broken|struggle/i.test(trimmed);
    const hasSolutionKeywords = /solution|platform|engine|architecture|automate|transform/i.test(trimmed);
    const hasMetricKeywords = /percent|growth|retention|cac|ltv|revenue|metric|scale/i.test(trimmed);
    const hasVisionKeywords = /future|roadmap|mission|expand|opportunity|invest/i.test(trimmed);

    let narrativePillars = 0;
    if (hasPainKeywords) narrativePillars++;
    if (hasSolutionKeywords) narrativePillars++;
    if (hasMetricKeywords) narrativePillars++;
    if (hasVisionKeywords) narrativePillars++;

    const structureScore = Math.min(96, Math.max(60, 68 + narrativePillars * 7));

    const overallScore = Math.round(
      (pacingScore * 0.3) +
      (fluencyScore * 0.35) +
      (structureScore * 0.35)
    );

    // Key strengths quoting actual user presentation
    const keyStrengths: string[] = [];
    if (wordsCount > 30) {
      keyStrengths.push(`Articulated keynote message over ${wordsCount} words with focused delivery`);
    }
    if (narrativePillars >= 3) {
      keyStrengths.push(`Structured narrative covered key business pillars (problem, solution, and growth vectors)`);
    }
    if (pacingScore >= 85) {
      keyStrengths.push(`Maintained measured executive tempo at ${wpm} Words Per Minute`);
    }
    if (keyStrengths.length === 0) {
      keyStrengths.push(`Delivered complete pitch across ${slidesCovered} deck sections`);
    }

    // Concrete improvement recommendations
    const improvementRecommendations: string[] = [];
    if (fillerCount >= 3) {
      improvementRecommendations.push(`Eliminate ${fillerCount} verbal pauses (e.g., "um", "like") by taking 1-second silent breaths before slide transitions`);
    }
    if (wpm < 110) {
      improvementRecommendations.push('Increase speech cadence to ~135 WPM to inject urgency into your product vision');
    } else if (wpm > 165) {
      improvementRecommendations.push('Slow speech rate on key numerical metrics to allow the audience to digest quantitative claims');
    }
    if (!hasMetricKeywords) {
      improvementRecommendations.push('Anchor the business case with concrete quantitative metrics (e.g., CAC, conversion rates, payback period)');
    }
    if (improvementRecommendations.length === 0) {
      improvementRecommendations.push('Enhance rhetorical impact by concluding slides with definitive call-to-action statements');
    }

    // Persist as a real session
    const sessionId = `sess_pres_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO sessions (id, user_id, scenario_id, status, mode, start_time, end_time)
      VALUES (?, ?, 'scen_presentation_keynote', 'completed', 'presentation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(sessionId, userId);

    // Record user presentation transcript
    db.prepare(`
      INSERT INTO messages (id, session_id, sender, content, audio_duration)
      VALUES (?, ?, 'user', ?, ?)
    `).run(`msg_${uuidv4().substring(0, 8)}`, sessionId, trimmed, effectiveDuration);

    // Persist evaluation
    const evalId = `eval_${uuidv4().substring(0, 8)}`;
    const summary = `Delivered pitch across ${slidesCovered} slides in ${Math.round(effectiveDuration)} seconds (${wpm} WPM). Cadence: ${cadenceVerdict}. Structural integrity: ${structureScore}/100.`;

    db.prepare(`
      INSERT INTO evaluations (
        id, session_id, user_id, overall_score, grammar_score, vocabulary_score,
        fluency_score, naturalness_score, confidence_score, persuasion_score, coherence_score,
        strongest_moment, biggest_opportunity, timeline_heatmap_json, corrections_json, summary
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      evalId,
      sessionId,
      userId,
      overallScore,
      85,
      82,
      fluencyScore,
      86,
      pacingScore,
      structureScore,
      structureScore,
      keyStrengths[0],
      improvementRecommendations[0],
      JSON.stringify([]),
      JSON.stringify([]),
      summary
    );

    // Update user Communication DNA
    PersonalizationService.updateDnaAfterSession(userId, {
      overallScore,
      grammarScore: 85,
      vocabularyScore: 82,
      fluencyScore,
      naturalnessScore: 86,
      confidenceScore: pacingScore,
      persuasionScore: structureScore,
      coherenceScore: structureScore,
      strongestMoment: keyStrengths[0],
      biggestOpportunity: improvementRecommendations[0],
      corrections: []
    });

    return {
      id: evalId,
      sessionId,
      overallScore,
      wordsSpoken: wordsCount,
      durationSeconds: effectiveDuration,
      wpm,
      fillerCount,
      pacingScore,
      fluencyScore,
      structureScore,
      cadenceVerdict,
      isAudioAnalyzed,
      keyStrengths,
      improvementRecommendations
    };
  }
}
