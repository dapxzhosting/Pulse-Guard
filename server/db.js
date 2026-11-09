import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

const DEFAULT_CONFIG = {
  title: 'PulseGuard Status',
  description: 'Real-time operational status and uptime performance metrics for all services.',
  customLogo: '',
  announcement: {
    enabled: true,
    type: 'info',
    message: 'Welcome to our live status page. All services are monitored 24/7 with instant failover alerts.'
  },
  showUptimeDays: 90,
};

const INITIAL_MONITORS = [
  {
    id: 'mon-1',
    name: 'Cloudflare DNS Primary',
    url: 'https://1.1.1.1',
    method: 'GET',
    interval: 30,
    timeout: 5,
    expectedStatus: 200,
    paused: false,
    status: 'UP',
    consecutiveFails: 0,
    consecutiveSuccesses: 10,
    sslCheckEnabled: true,
    sslAlertDaysThreshold: 30,
    group: 'Infrastructure',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
    uptime24h: 100,
    uptime7d: 99.98,
    uptime30d: 99.95,
    avgLatency24h: 24,
    lastChecked: new Date().toISOString(),
    notificationChannels: ['notif-1']
  },
  {
    id: 'mon-2',
    name: 'GitHub API Zen Endpoint',
    url: 'https://api.github.com/zen',
    method: 'GET',
    interval: 60,
    timeout: 10,
    expectedStatus: 200,
    paused: false,
    status: 'UP',
    consecutiveFails: 0,
    consecutiveSuccesses: 15,
    sslCheckEnabled: true,
    sslAlertDaysThreshold: 30,
    group: 'External APIs',
    createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    uptime24h: 99.9,
    uptime7d: 99.85,
    uptime30d: 99.72,
    avgLatency24h: 110,
    lastChecked: new Date().toISOString(),
    notificationChannels: ['notif-1']
  },
  {
    id: 'mon-3',
    name: 'Google Search Gateway',
    url: 'https://www.google.com',
    method: 'GET',
    interval: 30,
    timeout: 5,
    expectedStatus: 200,
    paused: false,
    status: 'UP',
    consecutiveFails: 0,
    consecutiveSuccesses: 20,
    sslCheckEnabled: true,
    sslAlertDaysThreshold: 30,
    group: 'Websites',
    createdAt: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
    uptime24h: 100,
    uptime7d: 100,
    uptime30d: 99.99,
    avgLatency24h: 42,
    lastChecked: new Date().toISOString(),
    notificationChannels: ['notif-1']
  },
  {
    id: 'mon-4',
    name: 'HTTPBin Status Simulator',
    url: 'https://httpbin.org/status/200',
    method: 'GET',
    interval: 60,
    timeout: 8,
    expectedStatus: 200,
    keyword: '',
    paused: false,
    status: 'UP',
    consecutiveFails: 0,
    consecutiveSuccesses: 5,
    sslCheckEnabled: true,
    sslAlertDaysThreshold: 20,
    group: 'Testing APIs',
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    uptime24h: 99.4,
    uptime7d: 99.2,
    uptime30d: 99.1,
    avgLatency24h: 185,
    lastChecked: new Date().toISOString(),
    notificationChannels: []
  }
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    name: 'DevOps Discord Alert',
    type: 'discord',
    enabled: true,
    config: {
      discordWebhookUrl: 'https://discord.com/api/webhooks/demo/placeholder'
    },
    events: ['down', 'up', 'ssl_warning']
  },
  {
    id: 'notif-2',
    name: 'On-Call Telegram Bot',
    type: 'telegram',
    enabled: false,
    config: {
      telegramBotToken: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
      telegramChatId: '-1001234567890'
    },
    events: ['down', 'up']
  }
];

class Database {
  constructor() {
    this.saveTimeout = null;
    this.ensureDirectory();
    this.data = this.load();
  }

  ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          monitors: parsed.monitors || [],
          heartbeats: parsed.heartbeats || [],
          incidents: parsed.incidents || [],
          notifications: parsed.notifications || [],
          publicStatusConfig: parsed.publicStatusConfig || DEFAULT_CONFIG,
        };
      }
    } catch (err) {
      console.error('Error loading database file, initializing fresh:', err);
    }

    const initial = {
      monitors: INITIAL_MONITORS,
      heartbeats: this.generateInitialHeartbeats(INITIAL_MONITORS),
      incidents: [],
      notifications: INITIAL_NOTIFICATIONS,
      publicStatusConfig: DEFAULT_CONFIG,
    };

    this.saveImmediate(initial);
    return initial;
  }

  generateInitialHeartbeats(monitors) {
    const list = [];
    const now = Date.now();
    for (const mon of monitors) {
      for (let i = 35; i >= 0; i--) {
        const ts = new Date(now - i * 10 * 60 * 1000).toISOString();
        const baseLatency = mon.avgLatency24h || 50;
        const latency = Math.max(15, Math.round(baseLatency + (Math.random() * 20 - 10)));
        list.push({
          id: `hb-${mon.id}-${i}`,
          monitorId: mon.id,
          status: 'UP',
          statusCode: 200,
          statusText: 'OK',
          latency,
          latencyBreakdown: {
            dns: Math.round(latency * 0.15),
            tcp: Math.round(latency * 0.25),
            tls: Math.round(latency * 0.3),
            ttfb: Math.round(latency * 0.25),
            total: latency
          },
          timestamp: ts,
        });
      }
    }
    return list;
  }

  scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.data);
      this.saveTimeout = null;
    }, 400);
  }

  saveImmediate(dataToSave) {
    try {
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(dataToSave, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  getMonitors() {
    return this.data.monitors;
  }

  getMonitor(id) {
    return this.data.monitors.find(m => m.id === id);
  }

  createMonitor(monitor) {
    const newMon = {
      ...monitor,
      id: `mon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      consecutiveFails: 0,
      consecutiveSuccesses: 0,
      status: 'PENDING',
      paused: monitor.paused ?? false,
      interval: Number(monitor.interval) || 60,
      timeout: Number(monitor.timeout) || 10,
      expectedStatus: Number(monitor.expectedStatus) || 200,
      sslCheckEnabled: monitor.sslCheckEnabled ?? true,
      sslAlertDaysThreshold: Number(monitor.sslAlertDaysThreshold) || 30,
      notificationChannels: monitor.notificationChannels || []
    };
    this.data.monitors.push(newMon);
    this.scheduleSave();
    return newMon;
  }

  updateMonitor(id, updates) {
    const index = this.data.monitors.findIndex(m => m.id === id);
    if (index === -1) return null;
    this.data.monitors[index] = { ...this.data.monitors[index], ...updates };
    this.scheduleSave();
    return this.data.monitors[index];
  }

  deleteMonitor(id) {
    const initialLen = this.data.monitors.length;
    this.data.monitors = this.data.monitors.filter(m => m.id !== id);
    this.data.heartbeats = this.data.heartbeats.filter(h => h.monitorId !== id);
    this.data.incidents = this.data.incidents.filter(i => i.monitorId !== id);
    this.scheduleSave();
    return this.data.monitors.length < initialLen;
  }

  addHeartbeat(hb) {
    const newHb = {
      ...hb,
      id: `hb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    this.data.heartbeats.push(newHb);

    const monitorHeartbeats = this.data.heartbeats.filter(h => h.monitorId === hb.monitorId);
    if (monitorHeartbeats.length > 2000) {
      const cutCount = monitorHeartbeats.length - 2000;
      let removed = 0;
      this.data.heartbeats = this.data.heartbeats.filter(h => {
        if (h.monitorId === hb.monitorId && removed < cutCount) {
          removed++;
          return false;
        }
        return true;
      });
    }

    this.recalculateMonitorMetrics(hb.monitorId);
    this.scheduleSave();
    return newHb;
  }

  getHeartbeats(monitorId, limit = 100) {
    return this.data.heartbeats
      .filter(h => h.monitorId === monitorId)
      .slice(-limit);
  }

  recalculateMonitorMetrics(monitorId) {
    const mon = this.data.monitors.find(m => m.id === monitorId);
    if (!mon) return;

    const list = this.data.heartbeats.filter(h => h.monitorId === monitorId);
    if (list.length === 0) return;

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const h24 = list.filter(h => new Date(h.timestamp).getTime() >= oneDayAgo);
    const h7d = list.filter(h => new Date(h.timestamp).getTime() >= sevenDaysAgo);
    const h30d = list.filter(h => new Date(h.timestamp).getTime() >= thirtyDaysAgo);

    if (h24.length > 0) {
      const upCount = h24.filter(h => h.status === 'UP').length;
      mon.uptime24h = Number(((upCount / h24.length) * 100).toFixed(2));
      const latencies = h24.filter(h => h.status === 'UP').map(h => h.latency);
      if (latencies.length > 0) {
        mon.avgLatency24h = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      }
    }

    if (h7d.length > 0) {
      const up7 = h7d.filter(h => h.status === 'UP').length;
      mon.uptime7d = Number(((up7 / h7d.length) * 100).toFixed(2));
    }

    if (h30d.length > 0) {
      const up30 = h30d.filter(h => h.status === 'UP').length;
      mon.uptime30d = Number(((up30 / h30d.length) * 100).toFixed(2));
    }
  }

  getIncidents() {
    return this.data.incidents.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  getActiveIncidents() {
    return this.data.incidents.filter(i => i.status !== 'RESOLVED');
  }

  createIncident(incident) {
    const startedAt = new Date().toISOString();
    const newInc = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      monitorId: incident.monitorId,
      monitorName: incident.monitorName,
      title: incident.title,
      status: incident.status || 'INVESTIGATING',
      cause: incident.cause,
      startedAt,
      updates: [
        {
          id: `up-${Date.now()}`,
          status: incident.status || 'INVESTIGATING',
          message: incident.initialMessage || 'Incident opened automatically by monitoring worker.',
          timestamp: startedAt
        }
      ]
    };
    this.data.incidents.push(newInc);
    this.scheduleSave();
    return newInc;
  }

  updateIncident(id, updates) {
    const inc = this.data.incidents.find(i => i.id === id);
    if (!inc) return null;
    Object.assign(inc, updates);
    this.scheduleSave();
    return inc;
  }

  addIncidentUpdate(id, status, message) {
    const inc = this.data.incidents.find(i => i.id === id);
    if (!inc) return null;
    inc.status = status;
    if (status === 'RESOLVED' && !inc.resolvedAt) {
      inc.resolvedAt = new Date().toISOString();
    }
    inc.updates.push({
      id: `up-${Date.now()}`,
      status,
      message,
      timestamp: new Date().toISOString()
    });
    this.scheduleSave();
    return inc;
  }

  getNotifications() {
    return this.data.notifications;
  }

  getNotification(id) {
    return this.data.notifications.find(n => n.id === id);
  }

  createNotification(notif) {
    const newNotif = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
    };
    this.data.notifications.push(newNotif);
    this.scheduleSave();
    return newNotif;
  }

  updateNotification(id, updates) {
    const index = this.data.notifications.findIndex(n => n.id === id);
    if (index === -1) return null;
    this.data.notifications[index] = { ...this.data.notifications[index], ...updates };
    this.scheduleSave();
    return this.data.notifications[index];
  }

  deleteNotification(id) {
    const initialLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter(n => n.id !== id);
    for (const m of this.data.monitors) {
      if (m.notificationChannels) {
        m.notificationChannels = m.notificationChannels.filter(nid => nid !== id);
      }
    }
    this.scheduleSave();
    return this.data.notifications.length < initialLen;
  }

  getPublicStatusConfig() {
    return this.data.publicStatusConfig;
  }

  updatePublicStatusConfig(updates) {
    this.data.publicStatusConfig = { ...this.data.publicStatusConfig, ...updates };
    this.scheduleSave();
    return this.data.publicStatusConfig;
  }
}

export const db = new Database();
