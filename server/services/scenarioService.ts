import { db } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

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
  ai_character_avatar: string;
  ai_character_personality: string;
  initial_message: string;
  complication_triggers: any[];
  is_custom: number;
  created_at?: string;
}

export class ScenarioService {
  static getAllScenarios(filters?: { category?: string; difficulty?: string }): Scenario[] {
    let query = 'SELECT * FROM scenarios WHERE 1=1';
    const params: any[] = [];

    if (filters?.category && filters.category !== 'All') {
      query += ' AND category LIKE ?';
      params.push(`%${filters.category}%`);
    }

    if (filters?.difficulty && filters.difficulty !== 'All') {
      query += ' AND difficulty = ?';
      params.push(filters.difficulty);
    }

    query += ' ORDER BY is_custom DESC, created_at ASC';

    const rows = db.prepare(query).all(...params) as any[];
    return rows.map(r => ({
      ...r,
      complication_triggers: typeof r.complication_triggers === 'string' ? JSON.parse(r.complication_triggers || '[]') : r.complication_triggers
    }));
  }

  static getScenarioById(id: string): Scenario | null {
    const row = db.prepare('SELECT * FROM scenarios WHERE id = ?').get(id) as any;
    if (!row) return null;
    return {
      ...row,
      complication_triggers: typeof row.complication_triggers === 'string' ? JSON.parse(row.complication_triggers || '[]') : row.complication_triggers
    };
  }

  static async generateCustomScenario(params: {
    situation: string;
    difficulty?: 'Foundational' | 'Fluid' | 'High Stakes';
    user_level?: string;
    objective?: string;
    character_role?: string;
    weakness_target?: string;
    apiKey?: string;
  }): Promise<Scenario> {
    const scenarioId = `scen_gen_${uuidv4().substring(0, 8)}`;
    const difficulty = params.difficulty || 'Fluid';
    const user_level = params.user_level || 'Intermediate';

    let title = `${params.situation.slice(0, 40).trim()}`;
    let characterName = 'Director Sterling';
    let characterRole = params.character_role || 'Senior Supervisor';
    let context = params.situation;
    let objective = params.objective || 'Successfully communicate your point, resolve friction, and align on an actionable next step.';
    let personality = 'Observant, objective-focused, reacts strictly to the tone and clarity of your words.';
    let initialMessage = `I understand you requested to discuss this situation immediately. Let's make this productive: what is your primary proposal, and how do you intend to address the current obstacles?`;

    // Try Gemini API if key is available
    const apiKey = params.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `You are the AI Scenario Architect for 'AI English Reality', an immersive AI English communication simulator.
Generate a realistic, high-tension conversational scenario based on:
Situation: ${params.situation}
Difficulty: ${difficulty}
User Level: ${user_level}
Target Weakness to challenge: ${params.weakness_target || 'General English agility'}
Objective: ${params.objective || 'Achieve mutual resolution'}

Return ONLY valid JSON matching this schema:
{
  "title": "Short punchy scenario title",
  "category": "One of: Travel, Workplace, Dispute, Emergency, High Stakes, Social, Academic",
  "context": "2-3 sentences rich atmospheric context describing the stakes",
  "objective": "Clear specific user objective to win the interaction",
  "ai_character_name": "Name of AI character",
  "ai_character_role": "Professional/social role",
  "ai_character_personality": "Tone, values, behavioral triggers",
  "initial_message": "Punchy, realistic opening remark spoken by the AI to open the interaction",
  "complication_triggers": [
    {
      "turn": 2,
      "type": "unexpected_objection",
      "announcement": "COMPLICATION: Description of unexpected event or pushback",
      "ai_reaction": "How the AI escalates or tests the user"
    }
  ]
}`;
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            title = parsed.title || title;
            characterName = parsed.ai_character_name || characterName;
            characterRole = parsed.ai_character_role || characterRole;
            personality = parsed.ai_character_personality || personality;
            context = parsed.context || context;
            objective = parsed.objective || objective;
            initialMessage = parsed.initial_message || initialMessage;
            var complicationTriggers = parsed.complication_triggers || [];
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed for scenario generation, using intelligent procedural fallback', err);
      }
    }

    if (!complicationTriggers || complicationTriggers.length === 0) {
      complicationTriggers = [
        {
          turn: 2,
          type: 'sudden_constraint',
          announcement: `COMPLICATION: New constraints emerge regarding ${params.situation.slice(0, 30)}.`,
          ai_reaction: `Wait, before you go any further: our timeline was just cut in half, and leadership requires a strict justification. How do you pivot right now?`
        }
      ];
    }

    const newScenario: Scenario = {
      id: scenarioId,
      title: title.startsWith('scen') ? 'Dynamic Reality Simulation' : title,
      category: 'Dynamic Custom',
      difficulty,
      user_level,
      context,
      objective,
      ai_character_name: characterName,
      ai_character_role: characterRole,
      ai_character_avatar: 'ai_custom_avatar',
      ai_character_personality: personality,
      initial_message: initialMessage,
      complication_triggers: complicationTriggers,
      is_custom: 1
    };

    db.prepare(`
      INSERT INTO scenarios (
        id, title, category, difficulty, user_level, context, objective,
        ai_character_name, ai_character_role, ai_character_avatar,
        ai_character_personality, initial_message, complication_triggers, is_custom
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      newScenario.id,
      newScenario.title,
      newScenario.category,
      newScenario.difficulty,
      newScenario.user_level,
      newScenario.context,
      newScenario.objective,
      newScenario.ai_character_name,
      newScenario.ai_character_role,
      newScenario.ai_character_avatar,
      newScenario.ai_character_personality,
      newScenario.initial_message,
      JSON.stringify(newScenario.complication_triggers)
    );

    return newScenario;
  }
}
