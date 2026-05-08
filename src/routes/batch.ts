import { Router, Request, Response } from 'express';
import { buildNotification, EventInput } from '../payloads';
import { sendToTarget } from '../sender';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { events } = req.body ?? {};

  if (!Array.isArray(events) || events.length === 0) {
    res.status(400).json({ error: 'events must be a non-empty array' });
    return;
  }

  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (typeof e?.analyticEventName !== 'string' || !e.analyticEventName) {
      res.status(400).json({ error: `events[${i}].analyticEventName is required` });
      return;
    }
    if (typeof e?.cameraId !== 'string' || !e.cameraId) {
      res.status(400).json({ error: `events[${i}].cameraId is required` });
      return;
    }
  }

  const payload = buildNotification(events as EventInput[]);
  const result = await sendToTarget(payload);

  res.status(result.success ? 201 : 502).json(result);
});

export default router;
