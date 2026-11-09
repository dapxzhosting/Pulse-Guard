import { Router } from 'express';
import { db } from '../db.js';
import { worker } from '../worker.js';

export const monitorsRouter = Router();

monitorsRouter.get('/', (req, res) => {
  const monitors = db.getMonitors();
  res.json({ monitors });
});

monitorsRouter.get('/:id', (req, res) => {
  const monitor = db.getMonitor(req.params.id);
  if (!monitor) {
    return res.status(404).json({ error: 'Monitor not found' });
  }
  res.json({ monitor });
});

monitorsRouter.post('/', (req, res) => {
  const {
    name,
    url,
    method,
    interval,
    timeout,
    expectedStatus,
    keyword,
    headers,
    body,
    sslCheckEnabled,
    sslAlertDaysThreshold,
    group,
    notificationChannels,
  } = req.body;

  if (!name || !url) {
    return res.status(400).json({ error: 'Name and URL are required' });
  }

  try {
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  const newMon = db.createMonitor({
    name,
    url,
    method: method || 'GET',
    interval: Number(interval) || 60,
    timeout: Number(timeout) || 10,
    expectedStatus: Number(expectedStatus) || 200,
    keyword: keyword || '',
    headers: headers || {},
    body: body || '',
    sslCheckEnabled: sslCheckEnabled ?? true,
    sslAlertDaysThreshold: Number(sslAlertDaysThreshold) || 30,
    group: group || 'General',
    notificationChannels: notificationChannels || [],
    paused: false,
  });

  worker.triggerImmediateCheck(newMon.id).catch(console.error);

  res.status(201).json({ monitor: newMon });
});

monitorsRouter.put('/:id', (req, res) => {
  const updated = db.updateMonitor(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Monitor not found' });
  }
  res.json({ monitor: updated });
});

monitorsRouter.delete('/:id', (req, res) => {
  const deleted = db.deleteMonitor(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Monitor not found' });
  }
  res.json({ success: true });
});

monitorsRouter.post('/:id/check-now', async (req, res) => {
  const success = await worker.triggerImmediateCheck(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Monitor not found' });
  }
  const updated = db.getMonitor(req.params.id);
  res.json({ success: true, monitor: updated });
});

monitorsRouter.post('/:id/toggle-pause', (req, res) => {
  const mon = db.getMonitor(req.params.id);
  if (!mon) {
    return res.status(404).json({ error: 'Monitor not found' });
  }
  const newPaused = !mon.paused;
  const updated = db.updateMonitor(mon.id, {
    paused: newPaused,
    status: newPaused ? 'PAUSED' : 'PENDING',
  });

  if (!newPaused) {
    worker.triggerImmediateCheck(mon.id).catch(console.error);
  }

  res.json({ monitor: updated });
});
