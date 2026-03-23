import express, { NextFunction, Request, Response } from 'express';
import eventRouter from './routes/event';
import batchRouter from './routes/batch';
import helloRouter from './routes/hello';
import heartbeatRouter from './routes/heartbeat';
import statusRouter from './routes/status';
import simulateRouter from './routes/simulate';

const app = express();

app.use(express.json());

app.use('/event', eventRouter);
app.use('/batch', batchRouter);
app.use('/hello', helloRouter);
app.use('/heartbeat', heartbeatRouter);
app.use('/status', statusRouter);
app.use('/simulate', simulateRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

export default app;
