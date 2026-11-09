import { db } from './db.js';
import { pingMonitor } from './services/checker.js';
import { checkSslCertificate } from './services/sslChecker.js';
import { handleStateTransition } from './services/incidentManager.js';
import { dispatchAlert } from './services/notifier.js';
import { Monitor } from './types.js';

class BackgroundWorker {
  private isRunning: boolean = false;
  private intervalTimer: NodeJS.Timeout | null = null;
  private nextRunMap: Map<string, number> = new Map();
  private isCheckingMap: Map<string, boolean> = new Map();
  private lastSslCheckMap: Map<string, number> = new Map();

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('⚡ [WORKER] Background monitoring engine started');

    this.intervalTimer = setInterval(() => this.tick(), 1000);

    setTimeout(() => this.checkAllMonitors(), 1500);
  }

  stop() {
    this.isRunning = false;
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    console.log('🛑 [WORKER] Background monitoring engine stopped');
  }

  private async tick() {
    const now = Date.now();
    const monitors = db.getMonitors().filter(m => !m.paused);

    for (const monitor of monitors) {
      const nextRun = this.nextRunMap.get(monitor.id) || 0;
      if (now >= nextRun && !this.isCheckingMap.get(monitor.id)) {
        const intervalMs = (monitor.interval || 60) * 1000;
        this.nextRunMap.set(monitor.id, now + intervalMs);

        this.runMonitorCheck(monitor).catch(err => {
          console.error(`[WORKER ERROR] Monitor check failed for ${monitor.name}:`, err);
        });
      }
    }
  }

  async runMonitorCheck(monitor: Monitor) {
    this.isCheckingMap.set(monitor.id, true);
    const now = new Date().toISOString();

    try {
      const checkResult = await pingMonitor(monitor);

      let sslInfo = monitor.sslInfo;
      const lastSsl = this.lastSslCheckMap.get(monitor.id) || 0;
      const twelveHours = 12 * 60 * 60 * 1000;

      if (monitor.sslCheckEnabled && monitor.url.startsWith('https://') && (!sslInfo || Date.now() - lastSsl > twelveHours)) {
        try {
          sslInfo = await checkSslCertificate(monitor.url);
          this.lastSslCheckMap.set(monitor.id, Date.now());

          const alertThreshold = monitor.sslAlertDaysThreshold || 30;
          if (sslInfo.daysRemaining !== undefined && sslInfo.daysRemaining <= alertThreshold) {
            console.warn(`[SSL WARNING] ${monitor.name} certificate expires in ${sslInfo.daysRemaining} days!`);
            this.notifySslWarning(monitor, sslInfo);
          }
        } catch (sslErr) {
          console.error(`[SSL CHECK FAILED] for ${monitor.name}:`, sslErr);
        }
      }

      db.addHeartbeat({
        monitorId: monitor.id,
        status: checkResult.status,
        statusCode: checkResult.statusCode,
        statusText: checkResult.statusText,
        latency: checkResult.latency,
        latencyBreakdown: checkResult.latencyBreakdown,
        message: checkResult.message,
        ssl: sslInfo,
        timestamp: now,
      });

      db.updateMonitor(monitor.id, {
        lastChecked: now,
        sslInfo,
      });

      await handleStateTransition(monitor, checkResult.status, {
        statusCode: checkResult.statusCode,
        message: checkResult.message,
      });
    } finally {
      this.isCheckingMap.set(monitor.id, false);
    }
  }

  async triggerImmediateCheck(monitorId: string): Promise<boolean> {
    const monitor = db.getMonitor(monitorId);
    if (!monitor) return false;

    this.nextRunMap.set(monitor.id, Date.now() + (monitor.interval || 60) * 1000);
    await this.runMonitorCheck(monitor);
    return true;
  }

  private async checkAllMonitors() {
    const monitors = db.getMonitors().filter(m => !m.paused);
    for (const monitor of monitors) {
      this.runMonitorCheck(monitor).catch(console.error);
    }
  }

  private async notifySslWarning(monitor: Monitor, sslInfo: any) {
    const channelIds = monitor.notificationChannels || [];
    const allChannels = db.getNotifications();

    for (const channelId of channelIds) {
      const channel = allChannels.find(c => c.id === channelId);
      if (channel && channel.enabled && channel.events.includes('ssl_warning')) {
        try {
          await dispatchAlert(channel, {
            type: 'ssl_warning',
            monitor,
            message: `Certificate issued to "${sslInfo.subject}" by "${sslInfo.issuer}" expires in ${sslInfo.daysRemaining} days (on ${new Date(sslInfo.validTo).toLocaleDateString()}).`,
            timestamp: new Date().toISOString(),
          });
        } catch (err) {
          console.error(`Failed to send SSL alert to channel ${channel.name}:`, err);
        }
      }
    }
  }
}

export const worker = new BackgroundWorker();
