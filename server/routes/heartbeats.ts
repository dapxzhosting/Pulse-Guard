import { Router } from 'express';
import { db } from '../db.js';

export const heartbeatsRouter = Router();

heartbeatsRouter.get('/:monitorId', (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const heartbeats = db.getHeartbeats(req.params.monitorId, limit);
  res.json({ heartbeats });
});
