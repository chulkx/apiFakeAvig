import { Router, Request, Response } from 'express';
import { config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  res.json({
    targetUrl: config.targetUrl,
    tokenConfigured: !!config.avigilonToken,
    port: config.port,
    timestamp: new Date().toISOString(),
  });
});

export default router;
