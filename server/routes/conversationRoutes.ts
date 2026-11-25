import { Router } from 'express';
import { ConversationService } from '../services/conversationService';

const router = Router();

router.post('/start', (req, res) => {
  try {
    const { userId, scenarioId, mode } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, error: 'Scenario ID is required' });
    }

    const effectiveUserId =
      userId ||
      (req.headers['x-user-id'] as string) ||
      'usr_sarah_chen';
    const result = ConversationService.createSession(effectiveUserId, scenarioId, mode || 'simulation');
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:sessionId/messages', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = ConversationService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }
    const messages = ConversationService.getMessages(sessionId);
    res.json({ success: true, session, messages });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/turn', async (req, res) => {
  try {
    const { sessionId, userInput, audioDuration, apiKey } = req.body;
    if (!sessionId || !userInput || !userInput.trim()) {
      return res.status(400).json({ success: false, error: 'sessionId and non-empty userInput are required' });
    }

    const result = await ConversationService.processUserTurn({
      sessionId,
      userInput: userInput.trim(),
      audioDuration: typeof audioDuration === 'number' ? audioDuration : 0,
      apiKey
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/:sessionId/end', (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = ConversationService.endSession(sessionId);
    res.json({ success: true, session });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
