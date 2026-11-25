import { Router } from 'express';
import { ModeService } from '../services/modeService';

const router = Router();

// ─── THINK IN ENGLISH ─────────────────────────────────────────────────────────

router.post('/think-in-english/audit', async (req, res) => {
  try {
    const userId =
      (req.headers['x-user-id'] as string) ||
      req.body.userId ||
      'usr_sarah_chen';

    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Request body must include a non-empty "text" field.'
      });
    }

    const result = await ModeService.auditThinkInEnglish(userId, text.trim());
    res.json({ success: true, result });
  } catch (err: any) {
    console.error('[modeRoutes] think-in-english/audit error:', err);
    res.status(500).json({ success: false, error: err.message || 'Audit failed' });
  }
});

// ─── DEBATE ARENA ─────────────────────────────────────────────────────────────

router.post('/debate/turn', async (req, res) => {
  try {
    const userId =
      (req.headers['x-user-id'] as string) ||
      req.body.userId ||
      'usr_sarah_chen';

    const { sessionId, stage, userArgument, motion } = req.body;

    if (!stage || !userArgument || typeof userArgument !== 'string' || !userArgument.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Required fields: stage (number), userArgument (string).'
      });
    }

    const result = await ModeService.processDebateTurn({
      sessionId,
      userId,
      stage: Number(stage),
      userArgument: userArgument.trim(),
      motion
    });

    res.json({ success: true, result });
  } catch (err: any) {
    console.error('[modeRoutes] debate/turn error:', err);
    res.status(500).json({ success: false, error: err.message || 'Debate turn processing failed' });
  }
});

router.post('/debate/evaluate', async (req, res) => {
  try {
    const userId =
      (req.headers['x-user-id'] as string) ||
      req.body.userId ||
      'usr_sarah_chen';

    const { sessionId, motion } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Required field: sessionId'
      });
    }

    const evaluation = await ModeService.evaluateDebate({ sessionId, userId, motion });
    res.json({ success: true, evaluation });
  } catch (err: any) {
    console.error('[modeRoutes] debate/evaluate error:', err);
    res.status(500).json({ success: false, error: err.message || 'Debate evaluation failed' });
  }
});

// ─── PRESENTATION COACH ───────────────────────────────────────────────────────

router.post('/presentation/evaluate', async (req, res) => {
  try {
    const userId =
      (req.headers['x-user-id'] as string) ||
      req.body.userId ||
      'usr_sarah_chen';

    const {
      spokenTranscript,
      durationSeconds,
      slidesCovered,
      fillerCount,
      isAudioAnalyzed
    } = req.body;

    if (!spokenTranscript || typeof spokenTranscript !== 'string' || !spokenTranscript.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Required field: spokenTranscript (non-empty string).'
      });
    }

    const result = await ModeService.evaluatePresentation({
      userId,
      spokenTranscript: spokenTranscript.trim(),
      durationSeconds: Number(durationSeconds) || 1,
      slidesCovered: Number(slidesCovered) || 1,
      fillerCount: Number(fillerCount) || 0,
      isAudioAnalyzed: Boolean(isAudioAnalyzed)
    });

    res.json({ success: true, result });
  } catch (err: any) {
    console.error('[modeRoutes] presentation/evaluate error:', err);
    res.status(500).json({ success: false, error: err.message || 'Presentation evaluation failed' });
  }
});

export default router;
