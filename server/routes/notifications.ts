import { Router } from 'express';
import { db } from '../db.js';
import { testNotificationChannel } from '../services/notifier.js';

export const notificationsRouter = Router();

notificationsRouter.get('/', (req, res) => {
  const notifications = db.getNotifications();
  res.json({ notifications });
});

notificationsRouter.post('/', (req, res) => {
  const { name, type, enabled, config, events } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const newNotif = db.createNotification({
    name,
    type,
    enabled: enabled ?? true,
    config: config || {},
    events: events || ['down', 'up', 'ssl_warning'],
  });

  res.status(201).json({ notification: newNotif });
});

notificationsRouter.put('/:id', (req, res) => {
  const updated = db.updateNotification(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Notification channel not found' });
  }
  res.json({ notification: updated });
});

notificationsRouter.delete('/:id', (req, res) => {
  const deleted = db.deleteNotification(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Notification channel not found' });
  }
  res.json({ success: true });
});

notificationsRouter.post('/:id/test', async (req, res) => {
  const channel = db.getNotification(req.params.id);
  if (!channel) {
    return res.status(404).json({ error: 'Notification channel not found' });
  }

  const result = await testNotificationChannel(channel);
  if (result.success) {
    res.json({ success: true, message: 'Test alert sent successfully!' });
  } else {
    res.status(400).json({ success: false, error: result.error });
  }
});
