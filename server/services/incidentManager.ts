import { db } from '../db.js';
import { Monitor } from '../types.js';
import { dispatchAlert } from './notifier.js';

export async function handleStateTransition(
  monitor: Monitor,
  newStatus: 'UP' | 'DOWN',
  checkDetails: { statusCode?: number; message?: string }
): Promise<void> {
  const previousStatus = monitor.status;
  const now = new Date();
  const nowIso = now.toISOString();

  const FAILURE_THRESHOLD = 2;

  if (newStatus === 'DOWN') {
    const fails = monitor.consecutiveFails + 1;
    monitor.consecutiveFails = fails;
    monitor.consecutiveSuccesses = 0;

    if (fails >= FAILURE_THRESHOLD && previousStatus !== 'DOWN') {
      monitor.status = 'DOWN';
      monitor.lastStatusChange = nowIso;
      db.updateMonitor(monitor.id, {
        status: 'DOWN',
        consecutiveFails: fails,
        consecutiveSuccesses: 0,
        lastStatusChange: nowIso,
      });

      const incident = db.createIncident({
        monitorId: monitor.id,
        monitorName: monitor.name,
        title: `Service Outage: ${monitor.name} is unreachable`,
        cause: checkDetails.message || `HTTP check failed with status ${checkDetails.statusCode || 'unreachable'}`,
        status: 'INVESTIGATING',
        initialMessage: `PulseGuard detected monitor failure (${checkDetails.message || 'connection failed'}). Automated investigations initiated.`,
      });

      console.log(`[INCIDENT OPENED] Monitor "${monitor.name}" is DOWN. Incident ID: ${incident.id}`);

      await notifyChannels(monitor, {
        type: 'down',
        monitor,
        statusCode: checkDetails.statusCode,
        message: checkDetails.message,
        timestamp: nowIso,
      });
    } else {
      db.updateMonitor(monitor.id, {
        consecutiveFails: fails,
        consecutiveSuccesses: 0,
      });
    }
  } else if (newStatus === 'UP') {
    const wasDown = previousStatus === 'DOWN';
    monitor.consecutiveSuccesses = (monitor.consecutiveSuccesses || 0) + 1;
    monitor.consecutiveFails = 0;
    monitor.status = 'UP';

    let downtimeText = '';
    if (wasDown && monitor.lastStatusChange) {
      const downStart = new Date(monitor.lastStatusChange).getTime();
      const diffMs = now.getTime() - downStart;
      downtimeText = formatDuration(diffMs);
    }

    db.updateMonitor(monitor.id, {
      status: 'UP',
      consecutiveFails: 0,
      consecutiveSuccesses: monitor.consecutiveSuccesses,
      lastStatusChange: wasDown ? nowIso : monitor.lastStatusChange,
    });

    if (wasDown) {
      console.log(`[MONITOR RECOVERED] Monitor "${monitor.name}" is back UP after ${downtimeText}!`);

      const activeIncidents = db.getActiveIncidents().filter(i => i.monitorId === monitor.id);
      for (const inc of activeIncidents) {
        db.addIncidentUpdate(
          inc.id,
          'RESOLVED',
          `Service recovered automatically. Server responded successfully (HTTP ${checkDetails.statusCode || 200}). Total downtime: ${downtimeText || 'a few moments'}.`
        );
      }

      await notifyChannels(monitor, {
        type: 'up',
        monitor,
        statusCode: checkDetails.statusCode,
        message: 'Service is back online and healthy.',
        downtimeDurationText: downtimeText,
        timestamp: nowIso,
      });
    }
  }
}

async function notifyChannels(monitor: Monitor, event: any) {
  const channelIds = monitor.notificationChannels || [];
  const allChannels = db.getNotifications();

  for (const channelId of channelIds) {
    const channel = allChannels.find(c => c.id === channelId);
    if (channel && channel.enabled) {
      try {
        await dispatchAlert(channel, event);
      } catch (err) {
        console.error(`Failed to send alert to channel "${channel.name}":`, err);
      }
    }
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSecs}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return `${hours}h ${remainingMins}m`;
}
