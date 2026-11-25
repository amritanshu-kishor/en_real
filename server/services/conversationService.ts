import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import { ScenarioService } from './scenarioService';

export interface Session {
  id: string;
  user_id: string;
  scenario_id: string;
  status: 'active' | 'completed' | 'abandoned';
  mode: 'simulation' | 'debate' | 'presentation' | 'think_in_english';
  start_time: string;
  end_time?: string;
  metadata?: any;
}

export interface Message {
  id: string;
  session_id: string;
  sender: 'user' | 'ai' | 'system';
  content: string;
  audio_duration?: number;
  timestamp?: string;
  complication_alert?: string;
  metadata?: any;
}

export class ConversationService {
  static createSession(userId: string, scenarioId: string, mode = 'simulation'): { session: Session; initialMessage: Message } {
    const sessionId = `sess_${uuidv4().substring(0, 8)}`;
    const scenario = ScenarioService.getScenarioById(scenarioId);

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    db.prepare(`
      INSERT INTO sessions (id, user_id, scenario_id, status, mode, start_time)
      VALUES (?, ?, ?, 'active', ?, CURRENT_TIMESTAMP)
    `).run(sessionId, userId, scenarioId, mode);

    const initialMsgId = `msg_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO messages (id, session_id, sender, content, audio_duration, complication_alert)
      VALUES (?, ?, 'ai', ?, 3.5, NULL)
    `).run(initialMsgId, sessionId, scenario.initial_message);

    const session: Session = {
      id: sessionId,
      user_id: userId,
      scenario_id: scenarioId,
      status: 'active',
      mode: mode as any,
      start_time: new Date().toISOString()
    };

    const initialMessage: Message = {
      id: initialMsgId,
      session_id: sessionId,
      sender: 'ai',
      content: scenario.initial_message,
      audio_duration: 3.5,
      timestamp: new Date().toISOString()
    };

    return { session, initialMessage };
  }

  static getSession(sessionId: string): Session | null {
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId) as any;
    return row || null;
  }

  static getMessages(sessionId: string): Message[] {
    const rows = db.prepare('SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC').all(sessionId) as any[];
    return rows;
  }

  static async processUserTurn(params: {
    sessionId: string;
    userInput: string;
    audioDuration?: number;
    apiKey?: string;
  }): Promise<{ userMessage: Message; aiMessage: Message; complicationAlert?: string }> {
    const { sessionId, userInput, audioDuration = 0, apiKey } = params;

    const session = this.getSession(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} does not exist`);
    }

    const scenario = ScenarioService.getScenarioById(session.scenario_id);
    if (!scenario) {
      throw new Error(`Scenario ${session.scenario_id} not found`);
    }

    // 1. Record user message
    const userMsgId = `msg_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO messages (id, session_id, sender, content, audio_duration)
      VALUES (?, ?, 'user', ?, ?)
    `).run(userMsgId, sessionId, userInput, audioDuration);

    const userMessage: Message = {
      id: userMsgId,
      session_id: sessionId,
      sender: 'user',
      content: userInput,
      audio_duration: audioDuration,
      timestamp: new Date().toISOString()
    };

    // 2. Fetch conversation history for context
    const allMessages = this.getMessages(sessionId);
    const userTurnCount = allMessages.filter(m => m.sender === 'user').length;

    // 3. Check for dynamic complication trigger
    let activeComplication: { announcement: string; ai_reaction: string } | null = null;
    if (scenario.complication_triggers && Array.isArray(scenario.complication_triggers)) {
      const matched = scenario.complication_triggers.find(c => c.turn === userTurnCount);
      if (matched) {
        activeComplication = matched;
      }
    }

    // 4. Generate AI response (using Gemini if key provided, else intelligent local engine)
    let aiResponseText = '';
    const resolvedApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (resolvedApiKey) {
      try {
        const historyText = allMessages
          .map(m => `${m.sender.toUpperCase()}: ${m.content}`)
          .join('\n');

        const systemPrompt = `You are roleplaying as ${scenario.ai_character_name}, whose role is ${scenario.ai_character_role}.
Personality: ${scenario.ai_character_personality}
Scenario Context: ${scenario.context}
Current Scenario Objective for the User: ${scenario.objective}

Guidelines:
1. Stay strictly in character. Do NOT break character or sound like an AI assistant.
2. React genuinely to the user's persuasion, grammar, emotional composure, and specific claims.
3. Be dynamic and challenging: do not immediately fold; make them earn every concession.
4. Keep spoken responses realistic (2 to 4 sentences).
${activeComplication ? `CRITICAL EVENT OCCURRING RIGHT NOW: ${activeComplication.announcement}. Incline your answer to include or react to this: "${activeComplication.ai_reaction}"` : ''}

Conversation so far:
${historyText}
AI CHARACTER RESPONSE:`;

        // Support gemini-2.0-flash and gemini-1.5-flash with timeout
        const callGemini = async (modelName: string) => {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 7000);
          try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${resolvedApiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }],
                generationConfig: {
                  temperature: 0.75,
                  maxOutputTokens: 250
                }
              })
            });
            clearTimeout(timer);
            if (resp.ok) {
              const data = await resp.json();
              return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
            }
            return '';
          } catch (e) {
            clearTimeout(timer);
            return '';
          }
        };

        aiResponseText = await callGemini('gemini-2.0-flash');
        if (!aiResponseText) {
          aiResponseText = await callGemini('gemini-1.5-flash');
        }
      } catch (err) {
        console.warn('Gemini API call failed, invoking intelligent local conversational engine:', err);
      }
    }

    // Fallback to intelligent state-aware conversational simulator
    if (!aiResponseText) {
      aiResponseText = this.generateLocalSimulationResponse({
        scenario,
        userInput,
        userTurnCount,
        activeComplication,
        history: allMessages
      });
    }

    // Estimate audio duration based on word count (~140 wpm = ~2.3 words/sec)
    const words = aiResponseText.split(/\s+/).filter(Boolean).length;
    const estimatedAudioDuration = Math.max(2.0, Math.round((words / 2.3) * 10) / 10);

    const aiMsgId = `msg_${uuidv4().substring(0, 8)}`;
    db.prepare(`
      INSERT INTO messages (id, session_id, sender, content, audio_duration, complication_alert)
      VALUES (?, ?, 'ai', ?, ?, ?)
    `).run(
      aiMsgId,
      sessionId,
      aiResponseText,
      estimatedAudioDuration,
      activeComplication ? activeComplication.announcement : null
    );

    const aiMessage: Message = {
      id: aiMsgId,
      session_id: sessionId,
      sender: 'ai',
      content: aiResponseText,
      audio_duration: estimatedAudioDuration,
      timestamp: new Date().toISOString(),
      complication_alert: activeComplication ? activeComplication.announcement : undefined
    };

    return {
      userMessage,
      aiMessage,
      complicationAlert: activeComplication ? activeComplication.announcement : undefined
    };
  }

  private static generateLocalSimulationResponse(ctx: {
    scenario: any;
    userInput: string;
    userTurnCount: number;
    activeComplication: any | null;
    history: Message[];
  }): string {
    const { scenario, userInput, userTurnCount, activeComplication } = ctx;
    const lowerInput = userInput.toLowerCase();

    // If an active complication is triggered, integrate it prominently
    if (activeComplication) {
      return `${activeComplication.ai_reaction}`;
    }

    const isPolite = lowerInput.includes('please') || lowerInput.includes('appreciate') || lowerInput.includes('understand') || lowerInput.includes('respect') || lowerInput.includes('thank you');
    const isDemanding = lowerInput.includes('demand') || lowerInput.includes('must') || lowerInput.includes('unacceptable') || lowerInput.includes('now') || lowerInput.includes('ridiculous');
    const hasEvidenceOrData = lowerInput.includes('because') || lowerInput.includes('specifically') || lowerInput.includes('percent') || lowerInput.includes('confirmed') || lowerInput.includes('document') || lowerInput.includes('policy') || lowerInput.includes('contract') || lowerInput.includes('number') || lowerInput.includes('$') || lowerInput.includes('data');
    const hasCompromise = lowerInput.includes('compromise') || lowerInput.includes('alternative') || lowerInput.includes('how about') || lowerInput.includes('what if') || lowerInput.includes('solution') || lowerInput.includes('instead');

    const charName = scenario.ai_character_name || 'Counterpart';
    const charRole = scenario.ai_character_role || 'Lead Representative';

    // Tailored character simulation based on scenario category
    if (scenario.id.includes('airport')) {
      if (userTurnCount >= 3 && (isPolite || hasEvidenceOrData || hasCompromise)) {
        return `Alright, look... you're handling this with more dignity than the mob shouting behind you. Let me check the partner codeshare manifest. If you have your original ticket reference ready, I might be able to slot you onto the 9:45 AM connection through Zurich. Can you guarantee your luggage is carry-on only?`;
      } else if (isDemanding) {
        return `Raising your voice won't magically de-ice an aircraft engine or make a Boeing 777 materialize on the tarmac. I need specific flight coordinates and a cooperative attitude, or I'll have to call terminal security to maintain order.`;
      } else {
        return `I understand you have a time constraint, but fifty other passengers have weddings, funerals, and board meetings too. What exact alternative route are you proposing, and have you checked your carrier endorsement?`;
      }
    }

    if (scenario.id.includes('hotel')) {
      if (hasEvidenceOrData && isPolite) {
        return `I appreciate your composure regarding this inconvenience. Let me review the VIP registry directly on our central console. I cannot promise the Presidential Suite, but I can unlock the 28th-floor Ambassador Corner with city panorama and waive all lounge service fees. Would that adequately rectify our oversight?`;
      } else if (isDemanding) {
        return `Sir, The Grand Horizon operates under strict Japanese hospitality standards, and threatening our staff does not expedite room reallocations. If you step to the side, I can verify if housekeeping has prepared any alternate suites.`;
      } else {
        return `I hear your concern regarding room 1402. Our engineering lead is currently on the floor. While we assess the mechanical noise, could you clarify whether a quiet high-floor executive twin would be acceptable if the suite cannot be immediately re-sanitized?`;
      }
    }

    if (scenario.id.includes('salary') || scenario.id.includes('negotiation')) {
      if (hasEvidenceOrData && userTurnCount >= 3) {
        return `Those numbers are compelling, and I don't dispute the impact of the pipeline refactor. But if I push HR for an 18% base variance, the CFO will demand you take on direct mentorship of the European team and own quarterly latency SLAs. Are you prepared to commit to those deliverables in writing?`;
      } else if (hasEvidenceOrData) {
        return `Your benchmarks are well-researched, but budget cycles don't move on past praise alone. If we adjust the variable bonus structure, how does your roadmap guarantee top-line revenue over the next two quarters?`;
      } else {
        return `Passion is great, but budget committees run on revenue attribution and retention risk. Give me the concrete benchmarks: if competitor offers exist, what are the terms, and how does your output justify breaking standard compensation bands?`;
      }
    }

    if (scenario.id.includes('boardroom') || scenario.id.includes('crisis')) {
      if (hasEvidenceOrData) {
        return `The post-mortem metric you've highlighted certainly puts the architecture failure in perspective. But our board convenes in twenty minutes. If the media catches wind of this latency spike, what is our explicit public disclosure strategy?`;
      } else if (hasCompromise) {
        return `That phased rollback timeline could work, provided we maintain data integrity for the Tier-1 financial clients. Walk me through the rollback verification step by step.`;
      } else {
        return `We don't have the luxury of speculative reassurances right now. What is the root cause, what is the downtime exposure, and who authorized the unverified deployment?`;
      }
    }

    if (scenario.id.includes('client') || scenario.id.includes('retention')) {
      if (isPolite && (hasCompromise || hasEvidenceOrData)) {
        return `I acknowledge the effort you've put into this SLA mitigation proposal. If your team commits to assigning a dedicated senior engineer to our account without additional retainers, we might consider extending the pilot through Q4. Can you sign off on that today?`;
      } else {
        return `Three enterprise outages in ninety days have cost us hundreds of billable hours. Why should our executive committee trust your renewal proposal over switching to an established competitor?`;
      }
    }

    if (scenario.id.includes('debate')) {
      if (lowerInput.includes('moral') || lowerInput.includes('conscious') || lowerInput.includes('agency')) {
        return `You speak eloquently of moral agency, but you conflate behavioral emulation with subjective qualia! If a machine feels no pain, fears no death, and bears no biological vulnerability, on what coherent philosophical premise does it possess inalienable rights?`;
      } else {
        return `A circular contention! You argue the conclusion as your premise. I challenge you to cite one single historical precedent where an insentient tool was endowed with civil personhood without catastrophic legal absurdity!`;
      }
    }

    if (scenario.id.includes('presentation')) {
      return `Solid cadence, but your value proposition needs sharper contrast. What is the single metric that proves your users cannot live without this solution, and what is your customer acquisition cost?`;
    }

    // Adaptive contextual simulation for custom or open-ended scenarios
    if (userTurnCount >= 4 && (hasEvidenceOrData || hasCompromise || isPolite)) {
      return `Based on how you've articulated this over the last few minutes, I can see the merit in your proposal. If we proceed on these terms, I will hold you personally accountable to the timeline we discussed. Are you ready to confirm that agreement?`;
    } else if (hasEvidenceOrData) {
      return `The concrete points you just brought up give me something real to evaluate. However, ${charRole.toLowerCase()} duties require me to consider the risk exposure. How do you propose we safeguard against potential downsides?`;
    } else if (hasCompromise) {
      return `That is a pragmatic concession, and I appreciate the constructive attitude. Let's make sure there are no ambiguities: what specific milestone will you deliver first?`;
    } else if (isDemanding) {
      return `Taking a rigid stance will not expedite an agreement here. If you want us to reach a workable consensus, let's step back and look at the realistic parameters on the table.`;
    } else if (isPolite) {
      return `Thank you for presenting your perspective so measuredly. That helps us find common ground. Before I sign off on this, tell me: what is the single most urgent priority you need addressed right now?`;
    } else {
      return `I'm listening closely, but you haven't fully addressed the core issue regarding ${scenario.objective ? scenario.objective.slice(0, 50) : 'our objective'}. In clear terms, what exactly is your bottom-line proposal?`;
    }
  }

  static endSession(sessionId: string): Session {
    db.prepare(`
      UPDATE sessions
      SET status = 'completed', end_time = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(sessionId);

    const session = this.getSession(sessionId);
    if (!session) throw new Error('Session not found');
    return session;
  }
}
