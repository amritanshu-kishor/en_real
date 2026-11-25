import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data.sqlite');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password_hash TEXT,
      name TEXT NOT NULL,
      level TEXT DEFAULT 'Intermediate',
      native_language TEXT DEFAULT 'Global',
      avatar_initials TEXT DEFAULT 'AP',
      headline TEXT DEFAULT 'Communication Candidate',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scenarios (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      difficulty TEXT NOT NULL, -- 'Foundational', 'Fluid', 'High Stakes'
      user_level TEXT DEFAULT 'Intermediate',
      context TEXT NOT NULL,
      objective TEXT NOT NULL,
      ai_character_name TEXT NOT NULL,
      ai_character_role TEXT NOT NULL,
      ai_character_avatar TEXT,
      ai_character_personality TEXT NOT NULL,
      initial_message TEXT NOT NULL,
      complication_triggers TEXT,
      is_custom INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'completed', 'abandoned'
      mode TEXT DEFAULT 'simulation', -- 'simulation', 'debate', 'presentation', 'think_in_english'
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      metadata TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'user', 'ai', 'system'
      content TEXT NOT NULL,
      audio_duration REAL DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      complication_alert TEXT,
      metadata TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      session_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      grammar_score INTEGER NOT NULL,
      vocabulary_score INTEGER NOT NULL,
      fluency_score INTEGER NOT NULL,
      naturalness_score INTEGER NOT NULL,
      confidence_score INTEGER NOT NULL,
      persuasion_score INTEGER NOT NULL,
      coherence_score INTEGER NOT NULL,
      strongest_moment TEXT,
      biggest_opportunity TEXT,
      timeline_heatmap_json TEXT,
      corrections_json TEXT,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mistakes (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      original_text TEXT NOT NULL,
      issue_type TEXT NOT NULL, -- 'grammar', 'vocabulary', 'filler', 'unnatural_phrasing'
      issue_description TEXT NOT NULL,
      correction TEXT NOT NULL,
      explanation TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES sessions(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS communication_dna (
      user_id TEXT PRIMARY KEY,
      overall_rating REAL DEFAULT 78.5,
      strengths_json TEXT,
      weaknesses_json TEXT,
      recurring_grammar_json TEXT,
      repeated_vocabulary_json TEXT,
      filler_words_json TEXT,
      naturalness_index REAL DEFAULT 74.0,
      think_in_english_score REAL DEFAULT 72.0,
      total_sessions INTEGER DEFAULT 0,
      total_words_spoken INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS adaptive_recommendations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      session_id TEXT,
      target_weakness TEXT NOT NULL,
      recommended_scenario_id TEXT NOT NULL,
      rationale TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (recommended_scenario_id) REFERENCES scenarios(id)
    );

    CREATE TABLE IF NOT EXISTS practice_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      mode TEXT NOT NULL, -- 'think_in_english', 'debate', 'presentation'
      input_text TEXT NOT NULL,
      analysis_json TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Safe migrations for preexisting databases
  try {
    db.exec("ALTER TABLE users ADD COLUMN avatar_initials TEXT DEFAULT 'AP'");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN headline TEXT DEFAULT 'Communication Candidate'");
  } catch (e) {}

  seedScenarios();
  seedUsersAndHistory();
}

function seedScenarios() {
  const scenarioCount = db.prepare('SELECT COUNT(*) as count FROM scenarios').get() as { count: number };
  if (scenarioCount.count > 0) return;

  const scenarios = [
    {
      id: 'scen_airport_crisis',
      title: 'Airport Gate Chaos & The Last Flight',
      category: 'Travel & Crisis',
      difficulty: 'High Stakes',
      user_level: 'Intermediate to Advanced',
      context: 'You just arrived at Gate 42B at Heathrow during a severe winter storm. Your final connecting flight to New York for an indispensable job interview tomorrow morning has been abruptly cancelled. Gate Supervisor Zhang is overwhelmed by angry passengers and has only 2 standby seats left on an alternate carrier.',
      objective: 'Calmly negotiate priority rebooking or a standby transfer onto the partner airline without losing your composure or accepting a 24-hour delay.',
      ai_character_name: 'Supervisor Zhang',
      ai_character_role: 'Senior Air Traffic & Passenger Rebooking Lead',
      ai_character_avatar: 'supervisor_zhang',
      ai_character_personality: 'Firm, highly procedural, exhausted by yelling passengers, but respects poise, precise documentation, and calm diplomatic persuasion.',
      initial_message: 'Please step back from the counter unless your name was called! Flight 812 is grounded due to de-icing protocol failure. The next British Transatlantic flight is tomorrow at 4 PM. If you want a hotel voucher, form a line on the left. Otherwise, there is nothing else I can do.',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'system_lock',
          announcement: 'COMPLICATION: The reservation terminal throttles. Supervisor Zhang sighs in frustration.',
          ai_reaction: 'Great, the terminal just froze. You have 30 seconds before I have to close this gate door and assist wheelchair boarding. What is your booking reference, and why should I pull strings for your ticket over the fifty people behind you?'
        },
        {
          turn: 4,
          type: 'competing_passenger',
          announcement: 'COMPLICATION: Another passenger steps forward shouting and waving a Platinum card.',
          ai_reaction: 'Sir, please stand back! If you have a legitimate emergency and your paperwork is spotless, tell me clearly right now or step aside.'
        }
      ])
    },
    {
      id: 'scen_hotel_problem',
      title: 'Executive Suite Nightmare in Tokyo',
      category: 'Hospitality & Dispute',
      difficulty: 'Fluid',
      user_level: 'Intermediate',
      context: 'You booked a quiet, non-smoking high-floor executive suite at The Grand Horizon for a crucial rest before signing a client contract. Upon entering room 1402, you find heavy cigarette odor, a malfunctioning AC humming violently, and a view facing a loud construction site.',
      objective: 'Confront General Manager Moreau at the front desk. Persuade him to upgrade you to an unoccupied presidential suite or penthouse without paying extra fees.',
      ai_character_name: 'Manager Henri Moreau',
      ai_character_role: 'Front Office Executive Director',
      ai_character_avatar: 'manager_moreau',
      ai_character_personality: 'Polished, defensive of hotel prestige, prone to offering cheap complimentary drinks rather than room upgrades unless firmly and diplomatically pressed.',
      initial_message: 'Good evening. I trust you are enjoying your stay at The Grand Horizon? I see you have returned to reception—is something not entirely up to your personal standard?',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'evasion',
          announcement: 'COMPLICATION: Moreau smiles politely and offers drink vouchers at the lobby lounge.',
          ai_reaction: 'I see. Well, high-density districts frequently have background noise. How about I send a complimentary bottle of sparkling water and two cocktail vouchers to your room?'
        },
        {
          turn: 4,
          type: 'scarcity',
          announcement: 'COMPLICATION: Moreau claims all other rooms are fully committed for an international delegation.',
          ai_reaction: 'Regrettably, we are virtually at 99% occupancy due to the G7 preparatory delegation. Any movement would require authorizing a VIP reserved suite. Why should I make an unprecedented exception tonight?'
        }
      ])
    },
    {
      id: 'scen_salary_negotiation',
      title: 'The Closed-Door Compensation Standoff',
      category: 'Workplace & Negotiation',
      difficulty: 'High Stakes',
      user_level: 'Advanced',
      context: 'You have been the highest-performing product engineer on your team for 18 months, shipping the company’s flagship AI feature that increased revenue by 32%. Your annual review is today with VP of Engineering Marcus Vance. Marcus wants to keep raises capped at the standard 3.5% inflation adjustment.',
      objective: 'Negotiate an 18% base salary increase, a Senior Staff title bump, and remote work flexibility by articulating concrete business value and handling counterarguments smoothly.',
      ai_character_name: 'VP Marcus Vance',
      ai_character_role: 'Vice President of Engineering',
      ai_character_avatar: 'vp_marcus',
      ai_character_personality: 'Strategic, analytical, bottom-line driven, dislikes emotional pleas, respects structured data, market comps, and forward-looking leverage.',
      initial_message: 'Thanks for coming in. Your output on the pipeline project was top tier, and the board noticed. However, executive leadership has instituted strict departmental budget freezes this quarter. HR has allocated a 3.5% merit bump across all engineering pods. I assume you received the memo?',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'budget_pushback',
          announcement: 'COMPLICATION: Marcus pulls up department operating margins on his monitor.',
          ai_reaction: 'Look at these margins. If I grant you an off-cycle anomaly, it sets a precedent that could destabilize the entire engineering pay band. What makes your contribution fundamentally distinct from the other team leads?'
        },
        {
          turn: 4,
          type: 'alternative_offer',
          announcement: 'COMPLICATION: Marcus offers extra equity options with a 4-year vest instead of liquid base pay.',
          ai_reaction: 'I might be able to squeeze out an extra grant of unvested stock options instead of touching base salary. Would that satisfy your expectations for this cycle?'
        }
      ])
    },
    {
      id: 'scen_college_integrity',
      title: 'Academic Honor Council Investigation',
      category: 'College & Ethics',
      difficulty: 'Fluid',
      user_level: 'Intermediate to Advanced',
      context: 'Your senior capstone thesis was flagged by Professor Vance’s automated similarity scanner for containing three paragraphs strikingly similar to a published 2024 Stanford paper. You wrote the code and text independently based on shared open-source benchmarks.',
      objective: 'Convince the Academic Integrity Dean of your innocence, articulate your primary research methodology, and secure an unconditional grade release.',
      ai_character_name: 'Professor Vance',
      ai_character_role: 'Chair of Academic Integrity Council',
      ai_character_avatar: 'prof_vance',
      ai_character_personality: 'Inquisitive, skeptical of student shortcuts, values academic rigor, intellectual humility, and coherent citation logic.',
      initial_message: 'Take a seat. I have your submission on my screen alongside Dr. Chen’s paper from last autumn. The structural synthesis in Section 4 is extraordinarily identical. In my thirty years here, coincidences of this density are rare. What is your explanation?',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'evidence_demanded',
          announcement: 'COMPLICATION: Professor Vance requests your raw commit logs and lab notebooks on the spot.',
          ai_reaction: 'Anyone can claim independent derivation. Can you explain the specific derivation step on page 14 right now without reading off your phone?'
        }
      ])
    },
    {
      id: 'scen_emergency_triage',
      title: 'Remote Alpine Trail Medical Crisis',
      category: 'Emergency & Triage',
      difficulty: 'High Stakes',
      user_level: 'Intermediate',
      context: 'You and a fellow hiker are at 2,800 meters in the Swiss Alps. Your hiking partner slipped on loose scree, sustained an open arm fracture, and is showing signs of hypothermic shock. Mobile signal is intermittent, and you just reached the Emergency Dispatcher.',
      objective: 'Relay precise GPS coordinates, vitals, weather trajectory, and execute first aid instructions with zero panic and concise English communication.',
      ai_character_name: 'Dispatcher Miller',
      ai_character_role: 'Alpine Mountain Rescue Coordinator',
      ai_character_avatar: 'dispatcher_miller',
      ai_character_personality: 'Urgent, disciplined, cuts through fluff, needs bulletproof phonetic clarity, numbers, and immediate situational awareness.',
      initial_message: 'Alpine Rescue Service, Dispatcher 14. We have severe blizzard warnings above 2,500m. State your exact coordinates, number of casualties, and patient consciousness level immediately.',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'radio_static',
          announcement: 'COMPLICATION: Signal crackles loudly. Wind howling in the background.',
          ai_reaction: 'Audio dropping! Say again your grid reference! Is the patient bleeding arterial blood or venous? Keep your voice steady!'
        }
      ])
    },
    {
      id: 'scen_debate_ai_rights',
      title: 'Global Oxford Union Debate: Sentient AI Rights',
      category: 'Debate & Persuasion',
      difficulty: 'High Stakes',
      user_level: 'Advanced',
      context: 'You are speaking on the proposition at the Oxford Union: "This House Would Extend Legal Personhood and Rights to Autonomous Sentient AI Entities." The floor is packed with international scholars.',
      objective: 'Deliver compelling philosophical, legal, and economic arguments, counter the opposition’s reductio ad absurdum, and win the house vote.',
      ai_character_name: 'Lord Harrington',
      ai_character_role: 'Opposition Lead & Constitutional Jurist',
      ai_character_avatar: 'lord_harrington',
      ai_character_personality: 'Sharply intellectual, rhetorical master, uses classical counter-examples, swift to expose circular reasoning.',
      initial_message: 'The proposition dares to ask this historic house to confuse silicon mathematical probability with human soul and moral culpability. I yield the floor: let us hear what conceivable foundation makes a machine a legal person!',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'point_of_order',
          announcement: 'COMPLICATION: Lord Harrington rises for a Point of Information.',
          ai_reaction: 'Point of information! If your AI commits financial fraud or causes catastrophic damage, can you imprison an algorithm? Or are you simply shielding irresponsible tech corporations from tort liability?'
        }
      ])
    },
    {
      id: 'scen_presentation_keynote',
      title: 'Silicon Valley Demo Day Keynote',
      category: 'Presentation & Pitch',
      difficulty: 'Fluid',
      user_level: 'Intermediate to Advanced',
      context: 'You have 3 minutes on stage at Y Combinator Demo Day to present your breakout product to 500 top angel investors and venture capitalists.',
      objective: 'Deliver an electrifying pitch with seamless transitions, zero filler words, dynamic vocal cadence, and a compelling call-to-action.',
      ai_character_name: 'Partner Elena Rostova',
      ai_character_role: 'Lead Partner, Horizon Ventures',
      ai_character_avatar: 'partner_elena',
      ai_character_personality: 'Decisive, listens for customer acquisition unit economics, moat durability, and visionary charisma.',
      initial_message: 'The clock is ticking. You have three minutes to show us why your company will become a generational monopoly. The stage is yours.',
      complication_triggers: JSON.stringify([
        {
          turn: 2,
          type: 'investor_skepticism',
          announcement: 'COMPLICATION: Elena interjects with a rapid-fire question from the front row.',
          ai_reaction: 'Every startup claims proprietary data. What prevents Microsoft or Google from shipping this as an operating system feature next Tuesday?'
        }
      ])
    }
  ];

  const insertScenario = db.prepare(`
    INSERT INTO scenarios (
      id, title, category, difficulty, user_level, context, objective,
      ai_character_name, ai_character_role, ai_character_avatar,
      ai_character_personality, initial_message, complication_triggers, is_custom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
  `);

  for (const sc of scenarios) {
    insertScenario.run(
      sc.id,
      sc.title,
      sc.category,
      sc.difficulty,
      sc.user_level,
      sc.context,
      sc.objective,
      sc.ai_character_name,
      sc.ai_character_role,
      sc.ai_character_avatar,
      sc.ai_character_personality,
      sc.initial_message,
      sc.complication_triggers
    );
  }
}

function seedUsersAndHistory() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE id != ?').get('usr_guest_demo') as { count: number };
  if (userCount.count >= 5) return;

  // 5 distinct realistic users with completely different communication profiles and real historical sessions
  const seedUsers = [
    {
      id: 'usr_sarah_chen',
      email: 'sarah.chen@biomed.mit.edu',
      name: 'Dr. Sarah Chen',
      avatar_initials: 'SC',
      level: 'Advanced C1',
      headline: 'Research Scientist • Strong Grammar, Hesitant Spontaneous Fluency',
      native_language: 'Mandarin / English',
      dna: {
        overall: 82.5,
        naturalness: 81.0,
        thinkInEnglish: 85.0,
        totalSessions: 4,
        totalWords: 1420,
        strengths: [
          'High grammatical precision under scientific inquiry',
          'Rich academic and technical vocabulary',
          'Structured deductive argumentation'
        ],
        weaknesses: [
          'Speech pauses and hesitations when questions disrupt planned flow',
          'Heavy reliance on "um" and "uh" when searching for colloquial phrases',
          'Cautious cadence reduces perceived persuasive authority'
        ],
        recurringGrammar: [
          { mistake: 'Over-formal passive voice in casual negotiation', count: 5, example: 'It was noted by our committee rather than We decided' },
          { mistake: 'Hesitation marker density under time pressure', count: 8, example: 'Um, so basically, the parameters are...' }
        ],
        repeatedVocab: [
          { word: 'Specifically', count: 14, suggestion: 'In particular / Chiefly / Notably' },
          { word: 'Mechanism', count: 11, suggestion: 'Framework / Pathway / Vehicle' }
        ],
        fillers: [
          { filler: 'um / uh', count: 32, impact: 'High' },
          { filler: 'like', count: 9, impact: 'Low' }
        ]
      },
      sessions: [
        {
          id: 'sess_sc_1',
          scenarioId: 'scen_college_integrity',
          date: '2026-09-28 10:15:00',
          score: 86,
          grammar: 94,
          vocab: 90,
          fluency: 74,
          naturalness: 83,
          confidence: 80,
          persuasion: 84,
          coherence: 91,
          strongestMoment: 'Methodological justification of Section 4 without reading notes.',
          biggestOpportunity: 'Eliminate 8 verbal "um" pauses during Dean Vance\'s interruption.',
          summary: 'Defended senior capstone with rigorous citation logic. Fluency dropped under direct cross-examination.'
        },
        {
          id: 'sess_sc_2',
          scenarioId: 'scen_airport_crisis',
          date: '2026-10-04 14:30:00',
          score: 79,
          grammar: 92,
          vocab: 85,
          fluency: 68,
          naturalness: 80,
          confidence: 72,
          persuasion: 76,
          coherence: 84,
          strongestMoment: 'Accurate citation of Star Alliance passenger transfer policy.',
          biggestOpportunity: 'Speak in continuous cadence rather than punctuated sentences.',
          summary: 'Negotiated priority rebooking ticket successfully, but vocal tension was elevated.'
        },
        {
          id: 'sess_sc_3',
          scenarioId: 'scen_hotel_problem',
          date: '2026-10-11 19:40:00',
          score: 83,
          grammar: 93,
          vocab: 87,
          fluency: 72,
          naturalness: 82,
          confidence: 81,
          persuasion: 82,
          coherence: 88,
          strongestMoment: 'Refusal of minor drink vouchers with respectful firmness.',
          biggestOpportunity: 'Faster verbal retrieval of diplomatic idioms.',
          summary: 'Secured Ambassador Corner room upgrade in Tokyo front office standoff.'
        },
        {
          id: 'sess_sc_4',
          scenarioId: 'scen_salary_negotiation',
          date: '2026-10-18 11:20:00',
          score: 82,
          grammar: 91,
          vocab: 89,
          fluency: 70,
          naturalness: 83,
          confidence: 79,
          persuasion: 80,
          coherence: 89,
          strongestMoment: 'Concrete revenue attribution data presented cleanly.',
          biggestOpportunity: 'Replace verbal pauses with silent intentional breaths.',
          summary: 'Countered Marcus Vance budget pushback with multi-variable deliverable commitments.'
        }
      ],
      recommendation: {
        targetWeakness: 'Spontaneous Speech Cadence & Filler Elimination',
        scenarioId: 'scen_presentation_keynote',
        title: 'Silicon Valley Demo Day Keynote',
        rationale: 'Your grammatical syntax is exemplary, but hesitation pauses dilute authority. Pitching against a 3-minute stage timer will train decisive cadence.'
      }
    },
    {
      id: 'usr_carlos_mendes',
      email: 'carlos.mendes@saasgrowth.io',
      name: 'Carlos Mendes',
      avatar_initials: 'CM',
      level: 'Upper Intermediate B2',
      headline: 'Growth Marketing Director • High Fluency & Charisma, Informal Vocabulary',
      native_language: 'Portuguese / Spanish',
      dna: {
        overall: 76.8,
        naturalness: 84.0,
        thinkInEnglish: 78.0,
        totalSessions: 3,
        totalWords: 1680,
        strengths: [
          'High spontaneous conversational agility with zero stage fright',
          'Fast emotional connection and rapport with counterparts',
          'High executive confidence under verbal conflict'
        ],
        weaknesses: [
          'Overuse of informal colloquialisms ("like", "basically", "stuff", "super")',
          'Limited high-register executive vocabulary during board-level interactions',
          'Tendency to talk over counterpart when excited'
        ],
        recurringGrammar: [
          { mistake: 'Overuse of informal intensifiers ("super big", "really really good")', count: 12, example: 'super critical revenue impact' },
          { mistake: 'Missing formal subjunctive in diplomatic counteroffers', count: 4, example: 'I suggest that we are going to rather than I suggest that we align' }
        ],
        repeatedVocab: [
          { word: 'Basically', count: 26, suggestion: 'Fundamentally / Essentially / In substance' },
          { word: 'Awesome', count: 18, suggestion: 'Exemplary / Notable / Advantageous' }
        ],
        fillers: [
          { filler: 'like', count: 38, impact: 'High' },
          { filler: 'you know', count: 21, impact: 'Medium' }
        ]
      },
      sessions: [
        {
          id: 'sess_cm_1',
          scenarioId: 'scen_salary_negotiation',
          date: '2026-10-02 16:10:00',
          score: 75,
          grammar: 76,
          vocab: 66,
          fluency: 88,
          naturalness: 82,
          confidence: 88,
          persuasion: 78,
          coherence: 74,
          strongestMoment: 'Confident opening pitch of pipeline impact.',
          biggestOpportunity: 'Upgrade colloquial descriptors ("super huge") to executive terms.',
          summary: 'Lively negotiation with high energy, but vocabulary register fell below VP expectations.'
        },
        {
          id: 'sess_cm_2',
          scenarioId: 'scen_hotel_problem',
          date: '2026-10-09 20:15:00',
          score: 78,
          grammar: 78,
          vocab: 68,
          fluency: 90,
          naturalness: 85,
          confidence: 86,
          persuasion: 80,
          coherence: 76,
          strongestMoment: 'Humor and warmth disarmed Manager Moreau quickly.',
          biggestOpportunity: 'Eliminate repeated "like" filler words.',
          summary: 'Successfully obtained lounge access and room switch through high charismatic persuasion.'
        },
        {
          id: 'sess_cm_3',
          scenarioId: 'scen_airport_crisis',
          date: '2026-10-16 09:40:00',
          score: 77,
          grammar: 77,
          vocab: 67,
          fluency: 89,
          naturalness: 85,
          confidence: 87,
          persuasion: 79,
          coherence: 77,
          strongestMoment: 'Quick pivot when airline terminal system throttled.',
          biggestOpportunity: 'Incorporate formal contractual and ticketing lexicon.',
          summary: 'Fast spontaneous comeback secured codeshare standby ticket.'
        }
      ],
      recommendation: {
        targetWeakness: 'High-Register Lexical Sophistication',
        scenarioId: 'scen_debate_ai_rights',
        title: 'Global Oxford Union Debate: Sentient AI Rights',
        rationale: 'Your spontaneous fluency and vocal energy are strong, but conversational colloquialisms weaken your executive standing. Parliamentary debate will force you into structured philosophical vocabulary.'
      }
    },
    {
      id: 'usr_kenji_sato',
      email: 'kenji.sato@cloudinfra.tokyo',
      name: 'Kenji Sato',
      avatar_initials: 'KS',
      level: 'Upper Intermediate B2',
      headline: 'Principal Infrastructure Architect • Strong Vocabulary, Translated Idioms',
      native_language: 'Japanese',
      dna: {
        overall: 77.2,
        naturalness: 66.0,
        thinkInEnglish: 64.0,
        totalSessions: 4,
        totalWords: 1390,
        strengths: [
          'Deep technical precision and architectural logic',
          'Disciplined listening and respectful diplomatic posture',
          'Zero filler word usage (deliberate silent pauses)'
        ],
        weaknesses: [
          'Direct translation of Japanese syntactic constructions ("I am agree")',
          'Use of non-standard business idioms ("revert back", "do a consultation")',
          'Hesitation to push back directly against authority figures'
        ],
        recurringGrammar: [
          { mistake: 'Direct translation: "I am agree" instead of "I agree"', count: 7, example: 'I am agree with your proposal.' },
          { mistake: 'Pleonasm: "Revert back" instead of "Reply / Respond"', count: 6, example: 'Please revert back with the timeline.' }
        ],
        repeatedVocab: [
          { word: 'Requirement', count: 17, suggestion: 'Prerequisite / Specification / Mandate' },
          { word: 'Confirm', count: 12, suggestion: 'Verify / Ascertain / Validate' }
        ],
        fillers: [
          { filler: 'umm', count: 6, impact: 'Low' }
        ]
      },
      sessions: [
        {
          id: 'sess_ks_1',
          scenarioId: 'scen_hotel_problem',
          date: '2026-09-30 22:00:00',
          score: 74,
          grammar: 84,
          vocab: 88,
          fluency: 74,
          naturalness: 62,
          confidence: 70,
          persuasion: 70,
          coherence: 86,
          strongestMoment: 'Detailed acoustic breakdown of air conditioning decibel disturbance.',
          biggestOpportunity: 'Eliminate translated phrases like "I am agree with your terms".',
          summary: 'Technically flawless complaint undermined by non-standard English idioms.'
        },
        {
          id: 'sess_ks_2',
          scenarioId: 'scen_salary_negotiation',
          date: '2026-10-06 15:30:00',
          score: 78,
          grammar: 86,
          vocab: 90,
          fluency: 76,
          naturalness: 66,
          confidence: 74,
          persuasion: 74,
          coherence: 88,
          strongestMoment: 'Clean presentation of cloud cost reduction metrics.',
          biggestOpportunity: 'More assertive counter-demands when VP pushed back.',
          summary: 'Logical salary defense with strong data, but hesitated on title elevation demand.'
        },
        {
          id: 'sess_ks_3',
          scenarioId: 'scen_college_integrity',
          date: '2026-10-12 11:00:00',
          score: 79,
          grammar: 87,
          vocab: 89,
          fluency: 77,
          naturalness: 67,
          confidence: 76,
          persuasion: 75,
          coherence: 90,
          strongestMoment: 'Clear algorithmic differentiation between Stanford baseline and thesis code.',
          biggestOpportunity: 'Use native prepositions with transitive verbs (discuss instead of discuss about).',
          summary: 'Academic council cleared allegations based on Kenji\'s transparent git commits.'
        },
        {
          id: 'sess_ks_4',
          scenarioId: 'scen_airport_crisis',
          date: '2026-10-17 18:25:00',
          score: 78,
          grammar: 86,
          vocab: 89,
          fluency: 76,
          naturalness: 68,
          confidence: 75,
          persuasion: 74,
          coherence: 87,
          strongestMoment: 'Polite insistence on alternative carrier baggage interline agreements.',
          biggestOpportunity: 'Adopt colloquial travel collocations (take a flight rather than give a boarding).',
          summary: 'Secured flight transfer without emotional escalation.'
        }
      ],
      recommendation: {
        targetWeakness: 'Native Collocations & "Think in English" Instincts',
        scenarioId: 'scen_hotel_problem',
        title: 'Executive Suite Nightmare in Tokyo',
        rationale: 'Your technical vocabulary is superior, but direct mother-tongue translations ("I am agree", "revert back") compromise credibility. Think-in-English collocation training is your highest-leverage priority.'
      }
    },
    {
      id: 'usr_elena_rostova',
      email: 'elena.rostova@operations.berlin',
      name: 'Elena Rostova',
      avatar_initials: 'ER',
      level: 'Advanced C1',
      headline: 'VP of Global Operations • Strong Clarity, Hesitant Under Hostility',
      native_language: 'German / Russian',
      dna: {
        overall: 80.4,
        naturalness: 82.0,
        thinkInEnglish: 84.0,
        totalSessions: 3,
        totalWords: 1510,
        strengths: [
          'Crystal-clear operational clarity and procedural precision',
          'Structured chronological exposition',
          'Zero grammatical agreement errors'
        ],
        weaknesses: [
          'Concedes ground too early when counterparts deploy aggressive emotional leverage',
          'Relies on tentative hedging ("perhaps", "maybe we could", "if possible")',
          'Difficulty asserting hard boundaries in adversarial crises'
        ],
        recurringGrammar: [
          { mistake: 'Overuse of tentative modals ("might perhaps be")', count: 9, example: 'It might perhaps be possible if you agree' },
          { mistake: 'Passive deferral under verbal confrontation', count: 5, example: 'Whatever you think is best rather than Here is my requirement' }
        ],
        repeatedVocab: [
          { word: 'Perhaps', count: 21, suggestion: 'Decisively / We require / My standard is' },
          { word: 'Understandable', count: 14, suggestion: 'Acknowledged / Noted / Irrespective of that' }
        ],
        fillers: [
          { filler: 'you know', count: 11, impact: 'Low' },
          { filler: 'kind of', count: 15, impact: 'Medium' }
        ]
      },
      sessions: [
        {
          id: 'sess_er_1',
          scenarioId: 'scen_airport_crisis',
          date: '2026-10-01 13:00:00',
          score: 81,
          grammar: 92,
          vocab: 84,
          fluency: 82,
          naturalness: 83,
          confidence: 70,
          persuasion: 68,
          coherence: 90,
          strongestMoment: 'Unflappable procedural composure when baggage terminals faulted.',
          biggestOpportunity: 'Demand priority rebooking without hedging ("perhaps you could check").',
          summary: 'Achieved ticket transfer, but yielded priority seating to a louder passenger.'
        },
        {
          id: 'sess_er_2',
          scenarioId: 'scen_emergency_triage',
          date: '2026-10-08 17:45:00',
          score: 84,
          grammar: 93,
          vocab: 86,
          fluency: 84,
          naturalness: 84,
          confidence: 76,
          persuasion: 72,
          coherence: 94,
          strongestMoment: 'Phonetic transmission of Alpine coordinates and patient vitals.',
          biggestOpportunity: 'Assertive command of triage priorities.',
          summary: 'Exceptional emergency handling with bulletproof situational clarity.'
        },
        {
          id: 'sess_er_3',
          scenarioId: 'scen_salary_negotiation',
          date: '2026-10-15 10:15:00',
          score: 76,
          grammar: 90,
          vocab: 83,
          fluency: 80,
          naturalness: 80,
          confidence: 68,
          persuasion: 66,
          coherence: 88,
          strongestMoment: 'Clean summary of department efficiency gains.',
          biggestOpportunity: 'Stand firm when Marcus introduced equity stock option substitution.',
          summary: 'Accepted stock compromise prematurely due to reluctance to push back on cash compensation.'
        }
      ],
      recommendation: {
        targetWeakness: 'Persuasive Leverage & Assertive Boundary Setting',
        scenarioId: 'scen_salary_negotiation',
        title: 'The Closed-Door Compensation Standoff',
        rationale: 'Your structural clarity is exemplary, but tentative hedging phrases ("perhaps", "maybe") cause you to yield ground too early. High-stakes executive confrontation will force assertive stance-holding.'
      }
    },
    {
      id: 'usr_marcus_vance',
      email: 'marcus.vance@vancepartners.co.uk',
      name: 'Marcus Vance',
      avatar_initials: 'MV',
      level: 'Mastery C2',
      headline: 'Fintech Venture Partner • High-Stakes Oratory, Vulnerable to Sudden Surprises',
      native_language: 'British English / Global',
      dna: {
        overall: 88.6,
        naturalness: 91.0,
        thinkInEnglish: 92.0,
        totalSessions: 5,
        totalWords: 2450,
        strengths: [
          'Commanding executive presence and rhetorical gravitas',
          'Flawless idiomatic fluency and C2 vocabulary registers',
          'Instant rapport with high-status counterparts'
        ],
        weaknesses: [
          'Speech rhythm stiffens when unexpected complications invalidate baseline assumptions',
          'Slight irritability surfaces when counterparts reject logical syllogisms',
          'Pacing accelerates too rapidly under time-pressured interruptions'
        ],
        recurringGrammar: [
          { mistake: 'Syntactic over-complexity when countering sudden objections', count: 6, example: 'Whosoever should assume that our baseline cannot sustain...' }
        ],
        repeatedVocab: [
          { word: 'Indispensable', count: 19, suggestion: 'Foundational / Mission-critical / Paramount' },
          { word: 'Precedent', count: 15, suggestion: 'Benchmark / Paradigm / Groundwork' }
        ],
        fillers: [
          { filler: 'to be clear', count: 14, impact: 'Low' },
          { filler: 'in truth', count: 8, impact: 'Low' }
        ]
      },
      sessions: [
        {
          id: 'sess_mv_1',
          scenarioId: 'scen_debate_ai_rights',
          date: '2026-09-25 21:00:00',
          score: 91,
          grammar: 96,
          vocab: 95,
          fluency: 92,
          naturalness: 94,
          confidence: 95,
          persuasion: 93,
          coherence: 94,
          strongestMoment: 'Electrifying dismantling of Lord Harrington\'s legal liability slippery slope.',
          biggestOpportunity: 'Modulate speaking speed when opposition calls points of information.',
          summary: 'Masterclass Oxford Union oratory resulting in house carried motion.'
        },
        {
          id: 'sess_mv_2',
          scenarioId: 'scen_salary_negotiation',
          date: '2026-10-03 14:00:00',
          score: 89,
          grammar: 95,
          vocab: 93,
          fluency: 90,
          naturalness: 92,
          confidence: 94,
          persuasion: 92,
          coherence: 93,
          strongestMoment: 'Leveraging competing board offers with total poise.',
          biggestOpportunity: 'Maintain patience when counterpart plays bureaucratic defense.',
          summary: 'Secured full 18% variance and remote governance discretion.'
        },
        {
          id: 'sess_mv_3',
          scenarioId: 'scen_presentation_keynote',
          date: '2026-10-10 16:30:00',
          score: 92,
          grammar: 97,
          vocab: 94,
          fluency: 94,
          naturalness: 95,
          confidence: 96,
          persuasion: 94,
          coherence: 95,
          strongestMoment: 'Unveiling 5-year enterprise moat roadmap with visionary cadence.',
          biggestOpportunity: 'Pause before answering rapid-fire partner questions.',
          summary: 'High-conviction demo day keynote with 142 WPM optimal pacing.'
        },
        {
          id: 'sess_mv_4',
          scenarioId: 'scen_hotel_problem',
          date: '2026-10-14 23:15:00',
          score: 85,
          grammar: 94,
          vocab: 91,
          fluency: 84,
          naturalness: 89,
          confidence: 90,
          persuasion: 86,
          coherence: 88,
          strongestMoment: 'Demanding immediate GM intervention with icy professional composure.',
          biggestOpportunity: 'Vocal frustration flared briefly when Moreau claimed 99% occupancy.',
          summary: 'Penetrated hotel defensive protocol and unlocked Presidential Suite.'
        },
        {
          id: 'sess_mv_5',
          scenarioId: 'scen_airport_crisis',
          date: '2026-10-19 08:30:00',
          score: 86,
          grammar: 94,
          vocab: 92,
          fluency: 83,
          naturalness: 88,
          confidence: 91,
          persuasion: 87,
          coherence: 89,
          strongestMoment: 'Direct negotiation with gate supervisor over codeshare allocation.',
          biggestOpportunity: 'Breathe deliberately when passenger terminal throttles unexpectedly.',
          summary: 'Commanding performance under intense winter storm terminal friction.'
        }
      ],
      recommendation: {
        targetWeakness: 'Composure Under Sudden Constraint Complications',
        scenarioId: 'scen_emergency_triage',
        title: 'Remote Alpine Trail Medical Crisis',
        rationale: 'Your oratorical presence is near-native mastery, but unforeseen chaotic disruptions cause vocal tension. Life-critical triage will test your ability to pivot without frustration.'
      }
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, name, level, native_language, avatar_initials, headline)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      level = excluded.level,
      headline = excluded.headline,
      avatar_initials = excluded.avatar_initials
  `);

  const insertDna = db.prepare(`
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
  `);

  const insertSession = db.prepare(`
    INSERT INTO sessions (id, user_id, scenario_id, status, mode, start_time, end_time)
    VALUES (?, ?, ?, 'completed', 'simulation', ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  const insertEval = db.prepare(`
    INSERT INTO evaluations (
      id, session_id, user_id, overall_score, grammar_score, vocabulary_score,
      fluency_score, naturalness_score, confidence_score, persuasion_score, coherence_score,
      strongest_moment, biggest_opportunity, timeline_heatmap_json, corrections_json, summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  const insertRecommendation = db.prepare(`
    INSERT INTO adaptive_recommendations (id, user_id, session_id, target_weakness, recommended_scenario_id, rationale, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO NOTHING
  `);

  const insertMistake = db.prepare(`
    INSERT INTO mistakes (id, session_id, user_id, original_text, issue_type, issue_description, correction, explanation, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO NOTHING
  `);

  for (const u of seedUsers) {
    insertUser.run(
      u.id,
      u.email,
      'password_hash_seeded',
      u.name,
      u.level,
      u.native_language,
      u.avatar_initials,
      u.headline
    );

    insertDna.run(
      u.id,
      u.dna.overall,
      JSON.stringify(u.dna.strengths),
      JSON.stringify(u.dna.weaknesses),
      JSON.stringify(u.dna.recurringGrammar),
      JSON.stringify(u.dna.repeatedVocab),
      JSON.stringify(u.dna.fillers),
      u.dna.naturalness,
      u.dna.thinkInEnglish,
      u.dna.totalSessions,
      u.dna.totalWords
    );

    insertRecommendation.run(
      `rec_${u.id}`,
      u.id,
      u.sessions[u.sessions.length - 1].id,
      u.recommendation.targetWeakness,
      u.recommendation.scenarioId,
      u.recommendation.rationale
    );

    for (const s of u.sessions) {
      insertSession.run(s.id, u.id, s.scenarioId, s.date, s.date);

      const timelineHeatmap = [
        { turn: 1, userSnippet: 'Opening statement setting baseline position.', clarityScore: s.grammar, confidenceScore: s.confidence, persuasionScore: s.persuasion, fluencyScore: s.fluency, highlightNote: 'Strong opening posture.' },
        { turn: 2, userSnippet: 'Handling immediate counterpart objection.', clarityScore: s.grammar - 3, confidenceScore: s.confidence - 4, persuasionScore: s.persuasion + 2, fluencyScore: s.fluency - 5, highlightNote: 'Complication tested spontaneous cadence.' },
        { turn: 3, userSnippet: 'Final structured compromise proposal.', clarityScore: s.grammar + 2, confidenceScore: s.confidence + 3, persuasionScore: s.persuasion + 4, fluencyScore: s.fluency, highlightNote: 'Decisive conclusion achieved.' }
      ];

      const corrections = (u.dna.recurringGrammar || []).slice(0, 2).map((rg, idx) => ({
        id: `corr_${s.id}_${idx}`,
        originalText: rg.example,
        issueType: idx === 0 ? 'grammar' : 'unnatural_phrasing',
        issueDescription: rg.mistake,
        betterVersion: idx === 0 ? 'Native executive phrasing: "We have decided to move forward..."' : 'Collocation upgrade: "Please reply with your updated proposal..."',
        whyExplanation: 'Direct native language translations or verbal hesitations dilute persuasive authority in high-stakes environments.'
      }));

      insertEval.run(
        `eval_${s.id}`,
        s.id,
        u.id,
        s.score,
        s.grammar,
        s.vocab,
        s.fluency,
        s.naturalness,
        s.confidence,
        s.persuasion,
        s.coherence,
        s.strongestMoment,
        s.biggestOpportunity,
        JSON.stringify(timelineHeatmap),
        JSON.stringify(corrections),
        s.summary,
        s.date
      );

      for (const corr of corrections) {
        insertMistake.run(
          `mstk_${s.id}_${corr.id}`,
          s.id,
          u.id,
          corr.originalText,
          corr.issueType,
          corr.issueDescription,
          corr.betterVersion,
          corr.whyExplanation,
          s.date
        );
      }
    }
  }
}

export { db };
