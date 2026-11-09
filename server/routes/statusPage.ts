import { Router } from 'express';
import { db } from '../db.js';

export const statusPageRouter = Router();

statusPageRouter.get('/public', (req, res) => {
  const config = db.getPublicStatusConfig();
  const monitors = db.getMonitors().filter(m => !m.paused);
  const activeIncidents = db.getActiveIncidents();
  const pastIncidents = db.getIncidents().filter(i => i.status === 'RESOLVED').slice(0, 5);

  const groups: Record<string, typeof monitors> = {};
  for (const mon of monitors) {
    const groupName = mon.group || 'Core Services';
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(mon);
  }

  const hasDown = monitors.some(m => m.status === 'DOWN');
  const hasDegraded = monitors.some(m => m.status === 'DEGRADED') || activeIncidents.length > 0;
  let overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' = 'OPERATIONAL';
  if (hasDown) {
    overallStatus = 'OUTAGE';
  } else if (hasDegraded) {
    overallStatus = 'DEGRADED';
  }

  const uptimes = monitors.map(m => m.uptime30d || 100);
  const avgUptime = uptimes.length > 0
    ? Number((uptimes.reduce((a, b) => a + b, 0) / uptimes.length).toFixed(2))
    : 100;

  const monitorBars: Record<string, { status: string; timestamp: string }[]> = {};
  for (const mon of monitors) {
    const heartbeats = db.getHeartbeats(mon.id, 45);
    monitorBars[mon.id] = heartbeats.map(h => ({
      status: h.status,
      timestamp: h.timestamp,
    }));
  }

  res.json({
    config,
    overallStatus,
    avgUptime,
    monitors,
    groups,
    monitorBars,
    activeIncidents,
    pastIncidents,
  });
});

statusPageRouter.get('/config', (req, res) => {
  res.json({ config: db.getPublicStatusConfig() });
});

statusPageRouter.put('/config', (req, res) => {
  const updated = db.updatePublicStatusConfig(req.body);
  res.json({ config: updated });
});
