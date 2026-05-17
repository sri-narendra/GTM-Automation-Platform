import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { config } from '../config';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const mongoState = mongoose.connection.readyState;
  const stateMap: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      mongodb: stateMap[mongoState] || 'unknown',
      version: '1.0.0',
    },
  });
});

export default router;
