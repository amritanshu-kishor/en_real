import { Router } from 'express';
import { EvaluationService } from '../services/evaluationService';

const router = Router();

router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const apiKey = (req.headers['x-api-key'] as string) || (req.query.apiKey as string);

    const evaluation = await EvaluationService.evaluateSession(sessionId, apiKey);
    res.json({ success: true, evaluation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:sessionId/generate', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { apiKey } = req.body;

    const evaluation = await EvaluationService.evaluateSession(sessionId, apiKey);
    res.json({ success: true, evaluation });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
