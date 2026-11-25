import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase } from './db/database';

import authRoutes from './routes/authRoutes';
import scenarioRoutes from './routes/scenarioRoutes';
import conversationRoutes from './routes/conversationRoutes';
import evaluationRoutes from './routes/evaluationRoutes';
import dnaRoutes from './routes/dnaRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import modeRoutes from './routes/modeRoutes';

dotenv.config();

// Initialize SQLite database & seed data
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/dna', dnaRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/modes', modeRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    product: 'AI ENGLISH REALITY',
    tagline: "Don't practice English. Live it.",
    timestamp: new Date().toISOString()
  });
});

// Secure System & AI Engine Configuration (Never leaks secret keys)
app.get('/api/config', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim());
  res.json({
    success: true,
    hasGeminiKey: hasKey,
    engine: hasKey ? 'Google Gemini AI Cloud (Loaded from .env)' : 'Adaptive High-Fidelity Local Simulation',
    voiceEngine: 'Web Speech Neural Synthesis',
    envConfigured: true,
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error occurred'
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 AI ENGLISH REALITY Server running on port ${PORT}`);
  console.log(`   Tagline: "Don't practice English. Live it."`);
  console.log(`   Database: SQLite initialized at data.sqlite`);
  console.log(`======================================================\n`);
});

export default app;
