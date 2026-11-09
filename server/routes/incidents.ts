import { Router } from 'express';
import { db } from '../db.js';

export const incidentsRouter = Router();

incidentsRouter.get('/', (req, res) => {
  const incidents = db.getIncidents();
  res.json({ incidents });
});

incidentsRouter.post('/', (req, res) => {
  const { monitorId, title, status, cause, initialMessage } = req.body;

  let monitorName = 'System Component';
  if (monitorId) {
    const mon = db.getMonitor(monitorId);
    if (mon) monitorName = mon.name;
  }

  const newInc = db.createIncident({
    monitorId: monitorId || 'general',
    monitorName,
    title: title || 'Service Degradation',
    status: status || 'INVESTIGATING',
    cause: cause || '',
    initialMessage: initialMessage || 'Investigation has begun.',
  });

  res.status(201).json({ incident: newInc });
});

incidentsRouter.post('/:id/updates', (req, res) => {
  const { status, message } = req.body;
  if (!status || !message) {
    return res.status(400).json({ error: 'Status and message are required' });
  }

  const updated = db.addIncidentUpdate(req.params.id, status, message);
  if (!updated) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  res.json({ incident: updated });
});

incidentsRouter.put('/:id', (req, res) => {
  const updated = db.updateIncident(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ incident: updated });
});
