import { Router, Request, Response } from 'express';
import { buildHello } from '../payloads';
import { sendToTarget } from '../sender';

const router = Router();

router.post('/', async (_req: Request, res: Response) => {
  const payload = buildHello();
  const result = await sendToTarget(payload);
  res.status(result.success ? 200 : 502).json(result);
});

export default router;
