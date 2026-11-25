# AI ENGLISH REALITY

> **"Don't practice English. Live it."**

An immersive AI English communication simulator. Rather than passive interview prep or basic grammar checks, **AI English Reality** thrusts users into realistic, high-tension situations where they must communicate with autonomous AI characters to achieve concrete objectives under dynamic complications.

---

## 🌟 The Core Experience Loop

```
Scenario → Objective → AI Conversation → Dynamic Complications → User Resolves Situation → AI Analyzes → Profile Updates → Next Challenge Adapts
```

1. **High-Tension Scenarios**: Airport crisis, Tokyo hotel disputes, salary negotiations, academic integrity investigations, alpine emergencies, and demo day keynotes.
2. **Context-Aware Dialogue**: Dynamic, character-voiced conversations—never scripted question-and-answer trees.
3. **Dynamic Complications**: Unforeseen mid-dialogue events (terminal crashes, competing passengers, unexpected objections, hostile budget freezes) that test spontaneous composure.
4. **Evidence-Backed Debriefs**: Every score is supported by actual conversation evidence (**What you said → What was wrong → Better version → Why**).
5. **Persistent Communication DNA**: Tracks strengths, recurring grammatical patterns, repeated vocabulary, verbal filler density, and a "Think in English" index over time.
6. **Adaptive Learning Engine**: Automatically identifies individual weaknesses and synthesizes personalized next challenges.

---

## 🛠️ Architecture & Technology Stack

- **Frontend**: React 19 + TypeScript + Vite.
- **Styling**: Tailored **Vanilla CSS Design System** featuring minimal premium glassmorphism, frosted panels, dark charcoal aesthetics, glowing cyan/indigo atmospheric accents, and custom SVG mathematical radar charts.
- **Backend**: Express + TypeScript + SQLite (`better-sqlite3` in WAL mode for persistent storage).
- **Dual-Intelligence AI Engine**:
  - **Local State-Aware Neural Simulator**: Out-of-the-box algorithmic NLP token analysis, lexical diversity (Type-Token Ratio), filler word detection, and dynamic complication injection (100% reliable offline).
  - **Google Gemini 1.5 Flash API Integration**: Configurable in-app or via `GEMINI_API_KEY` for unlimited real-time generative roleplay dialogue and deep linguistic critique.
- **Voice Mode**:
  - Web Speech API SpeechRecognition (with graceful keyboard fallback).
  - Web Speech API SpeechSynthesis for realistic AI voice playback.
  - HTML5 Canvas soundwave visualizer powered by Web Audio API `AudioContext` & `AnalyserNode`.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
Launches both the Express backend (port 5000) and the Vite frontend (port 3001) concurrently:
```bash
npm run dev
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 📁 Project Structure

```
d:/en_real/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── data.sqlite                       # Persistent SQLite database
├── server/
│   ├── index.ts                      # Express API entrypoint
│   ├── db/
│   │   └── database.ts               # SQLite schema, tables & seed scenarios
│   ├── services/
│   │   ├── authService.ts            # User and guest management
│   │   ├── scenarioService.ts        # Scenarios and dynamic scenario generator
│   │   ├── conversationService.ts    # Dialogue orchestration & complication state machine
│   │   ├── evaluationService.ts      # Deep linguistic analysis & evidence extraction
│   │   ├── personalizationService.ts # Communication DNA synthesis & adaptive pathing
│   │   └── analyticsService.ts       # Command Center dashboard telemetry
│   ├── routes/                       # Modular REST endpoints
│   └── tests/
│       └── api.test.ts               # Automated Vitest/Supertest integration suite
└── src/
    └── client/
        ├── App.tsx                   # Main state machine & route controller
        ├── index.css                 # Glassmorphic design tokens & global CSS
        ├── components/
        │   ├── Navbar.tsx            # Global navigation & engine status
        │   ├── RadarChart.tsx        # Mathematical SVG 6-axis skill radar
        │   ├── ScoreGauge.tsx        # Glowing circular score meter
        │   ├── TimelineHeatmap.tsx   # Turn-by-turn performance matrix
        │   ├── ComplicationAlert.tsx # High-voltage dynamic crisis banner
        │   ├── EvidenceCard.tsx      # What you said -> What was wrong -> Better -> Why
        │   ├── AudioWaveform.tsx     # Canvas audio wave visualizer
        │   ├── ApiKeyModal.tsx       # Gemini API key & voice settings
        │   └── ScenarioGeneratorModal.tsx # Dynamic scenario builder
        ├── pages/
        │   ├── LandingPage.tsx       # Hero with interactive simulated conversation visual
        │   ├── DashboardPage.tsx     # Communication Command Center
        │   ├── ScenarioExplorerPage.tsx # Filterable scenario library & custom creator
        │   ├── LiveSimulationPage.tsx # Atmospheric cockpit with real-time speech
        │   ├── DebriefPage.tsx       # Post-session linguistic debrief
        │   ├── CommunicationDnaPage.tsx # Persistent habits & recurring patterns
        │   ├── ThinkInEnglishPage.tsx # Translation trap detector & native collocations
        │   ├── DebateArenaPage.tsx   # 5-stage Oxford Union debate arena
        │   └── PresentationCoachPage.tsx # Keynote delivery coach with slide pacing
        └── services/
            ├── api.ts                # Frontend API client
            └── speech.ts             # Web Speech recognition and synthesis
```

---

## 🎯 Special Simulation Arenas

1. **Think in English Mode**:
   - Detects translated idioms (e.g., *"giving an exam"*, *"open the light"*, *"I am agree"*, *"revert back"*, *"do a party"*).
   - Instant native collocations and linguistic rationales.
2. **The Oxford Debate Arena**:
   - 5-stage formal parliamentary debate against Lord Harrington on *"Sentient AI Legal Personhood"*:
     `Opening Argument → Opposition Counter → Rebuttal → Rapid Challenge (POI) → Final Argument`.
3. **Presentation & Keynote Coach**:
   - Live Demo Day pitch room with slide outline markers, pacing tracker (Words Per Minute), live filler counter, and delivery debrief.
