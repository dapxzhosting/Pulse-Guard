import { Router } from 'express';
import { db } from '../db.js';

export const statsRouter = Router();

statsRouter.get('/', (req, res) => {
  const monitors = db.getMonitors();
  const total = monitors.length;
  const up = monitors.filter(m => m.status === 'UP').length;
  const down = monitors.filter(m => m.status === 'DOWN').length;
  const paused = monitors.filter(m => m.paused).length;

  const activeMonitors = monitors.filter(m => !m.paused);
  const avgLatency = activeMonitors.length > 0
    ? Math.round(activeMonitors.reduce((acc, m) => acc + (m.avgLatency24h || 0), 0) / activeMonitors.length)
    : 0;

  const uptimes = activeMonitors.map(m => m.uptime24h || 100);
  const overallUptime = uptimes.length > 0
    ? Number((uptimes.reduce((a, b) => a + b, 0) / uptimes.length).toFixed(2))
    : 100;

  const activeIncidents = db.getActiveIncidents().length;

  res.json({
    totalMonitors: total,
    upMonitors: up,
    downMonitors: down,
    pausedMonitors: paused,
    overallUptime,
    avgLatency,
    activeIncidents,
  });
});
