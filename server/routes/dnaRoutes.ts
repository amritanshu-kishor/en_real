import { Router } from 'express';
import { PersonalizationService } from '../services/personalizationService';

const router = Router();

router.get('/', (req, res) => {
  try {
    const userId =
      (req.query.userId as string) ||
      (req.headers['x-user-id'] as string) ||
      'usr_sarah_chen';
    const dna = PersonalizationService.getDna(userId);
    const recommendation = PersonalizationService.getLatestRecommendation(userId);

    res.json({
      success: true,
      dna,
      recommendation
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
