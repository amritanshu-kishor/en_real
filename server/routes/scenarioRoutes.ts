import { Router } from 'express';
import { ScenarioService } from '../services/scenarioService';

const router = Router();

router.get('/', (req, res) => {
  try {
    const { category, difficulty } = req.query as { category?: string; difficulty?: string };
    const scenarios = ScenarioService.getAllScenarios({ category, difficulty });
    res.json({ success: true, scenarios });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const scenario = ScenarioService.getScenarioById(req.params.id);
    if (!scenario) {
      return res.status(404).json({ success: false, error: 'Scenario not found' });
    }
    res.json({ success: true, scenario });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/generate', async (req, res) => {
  try {
    const { situation, difficulty, user_level, objective, character_role, weakness_target, apiKey } = req.body;
    if (!situation) {
      return res.status(400).json({ success: false, error: 'Situation is required to generate a scenario' });
    }

    const scenario = await ScenarioService.generateCustomScenario({
      situation,
      difficulty,
      user_level,
      objective,
      character_role,
      weakness_target,
      apiKey
    });

    res.json({ success: true, scenario });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
