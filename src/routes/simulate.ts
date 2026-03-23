import { Router, Request, Response } from 'express';
import { simulator, SimulateMode } from '../simulator';

const router = Router();

const VALID_MODES: SimulateMode[] = ['random', 'sequential', 'burst'];

// POST /simulate/start
router.post('/start', (req: Request, res: Response) => {
  const { intervalMs, mode, scenariosFile } = req.body ?? {};

  if (typeof intervalMs !== 'number' || intervalMs < 100) {
    res.status(400).json({ error: 'intervalMs must be a number >= 100' });
    return;
  }
  if (!VALID_MODES.includes(mode as SimulateMode)) {
    res.status(400).json({ error: `mode must be one of: ${VALID_MODES.join(', ')}` });
    return;
  }

  try {
    simulator.start(mode as SimulateMode, intervalMs, scenariosFile as string | undefined);
    res.json({ success: true, status: simulator.status() });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// POST /simulate/stop
router.post('/stop', (_req: Request, res: Response) => {
  simulator.stop();
  res.json({ success: true, status: simulator.status() });
});

// GET /simulate/status
router.get('/status', (_req: Request, res: Response) => {
  res.json(simulator.status());
});

// POST /simulate/reload  — reload scenarios file without restarting
router.post('/reload', (req: Request, res: Response) => {
  const { scenariosFile } = req.body ?? {};
  try {
    simulator.loadScenarios(scenariosFile as string | undefined);
    res.json({ success: true, status: simulator.status() });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
