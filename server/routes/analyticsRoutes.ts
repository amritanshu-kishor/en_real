import { Router } from 'express';
import { AnalyticsService } from '../services/analyticsService';

const router = Router();

router.get('/dashboard', (req, res) => {
  try {
    const userId =
      (req.query.userId as string) ||
      (req.headers['x-user-id'] as string) ||
      'usr_sarah_chen';
    const data = AnalyticsService.getDashboardAnalytics(userId);
    res.json({ success: true, analytics: data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
