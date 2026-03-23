import { Router, Request, Response } from 'express';
import { buildNotification } from '../payloads';
import { sendToTarget } from '../sender';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { analyticEventName, cameraId, timestamp, id } = req.body ?? {};

  if (typeof analyticEventName !== 'string' || !analyticEventName) {
    res.status(400).json({ error: 'analyticEventName is required' });
    return;
  }
  if (typeof cameraId !== 'string' || !cameraId) {
    res.status(400).json({ error: 'cameraId is required' });
    return;
  }

  const payload = buildNotification([{ analyticEventName, cameraId, timestamp, id }]);
  const result = await sendToTarget(payload);

  res.status(result.success ? 201 : 502).json(result);
});

export default router;
