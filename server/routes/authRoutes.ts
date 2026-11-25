import { Router } from 'express';
import { AuthService } from '../services/authService';

const router = Router();

router.get('/users', (req, res) => {
  try {
    const users = AuthService.getAllUsers();
    res.json({ success: true, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/me', (req, res) => {
  try {
    const requestedUserId = (req.headers['x-user-id'] as string) || (req.query.userId as string);
    if (requestedUserId) {
      const user = AuthService.getUserById(requestedUserId);
      if (user) {
        return res.json({ success: true, user });
      }
    }
    const defaultUser = AuthService.getOrCreateGuest();
    res.json({ success: true, user: defaultUser });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/guest', (req, res) => {
  try {
    const { name } = req.body;
    const user = AuthService.getOrCreateGuest(name || 'Reality Pilot');
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/level', (req, res) => {
  try {
    const userId = (req.headers['x-user-id'] as string) || req.body.userId || 'usr_sarah_chen';
    const { level } = req.body;
    AuthService.updateUserLevel(userId, level);
    res.json({ success: true, level });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
