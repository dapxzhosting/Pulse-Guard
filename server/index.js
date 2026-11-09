import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './db.js';
import { worker } from './worker.js';
import { testNotificationChannel } from './services/notifier.js';

const __envFile = new URL('../.env', import.meta.url);
if (fs.existsSync(__envFile)) {
  const envLines = fs.readFileSync(__envFile, 'utf8').split('\n');
  for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;


  if (pathname === '/api/health' && method === 'GET') {
    return sendJson(res, 200, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  }

  if (pathname === '/api/stats' && method === 'GET') {
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

    return sendJson(res, 200, {
      totalMonitors: total,
      upMonitors: up,
      downMonitors: down,
      pausedMonitors: paused,
      overallUptime,
      avgLatency,
      activeIncidents,
    });
  }

  if (pathname === '/api/monitors' && method === 'GET') {
    return sendJson(res, 200, { monitors: db.getMonitors() });
  }

  if (pathname === '/api/monitors' && method === 'POST') {
    const body = await parseBody(req);
    if (!body.name || !body.url) {
      return sendJson(res, 400, { error: 'Name and URL are required' });
    }
    const newMon = db.createMonitor(body);
    worker.triggerImmediateCheck(newMon.id).catch(console.error);
    return sendJson(res, 201, { monitor: newMon });
  }

  const monMatch = pathname.match(/^\/api\/monitors\/([^\/]+)$/);
  if (monMatch) {
    const id = monMatch[1];
    if (method === 'GET') {
      const mon = db.getMonitor(id);
      return mon ? sendJson(res, 200, { monitor: mon }) : sendJson(res, 404, { error: 'Monitor not found' });
    }
    if (method === 'PUT') {
      const body = await parseBody(req);
      const updated = db.updateMonitor(id, body);
      return updated ? sendJson(res, 200, { monitor: updated }) : sendJson(res, 404, { error: 'Monitor not found' });
    }
    if (method === 'DELETE') {
      const deleted = db.deleteMonitor(id);
      return deleted ? sendJson(res, 200, { success: true }) : sendJson(res, 404, { error: 'Monitor not found' });
    }
  }

  const checkMatch = pathname.match(/^\/api\/monitors\/([^\/]+)\/(?:check-now|check)$/);
  if (checkMatch && method === 'POST') {
    const id = checkMatch[1];
    const success = await worker.triggerImmediateCheck(id);
    const updated = db.getMonitor(id);
    return success ? sendJson(res, 200, { success: true, monitor: updated }) : sendJson(res, 404, { error: 'Monitor not found' });
  }

  const pauseMatch = pathname.match(/^\/api\/monitors\/([^\/]+)\/(?:toggle-pause|pause)$/);
  if (pauseMatch && method === 'POST') {
    const id = pauseMatch[1];
    const mon = db.getMonitor(id);
    if (!mon) return sendJson(res, 404, { error: 'Monitor not found' });
    const newPaused = !mon.paused;
    const updated = db.updateMonitor(mon.id, {
      paused: newPaused,
      status: newPaused ? 'PAUSED' : 'PENDING',
    });
    if (!newPaused) worker.triggerImmediateCheck(mon.id).catch(console.error);
    return sendJson(res, 200, { monitor: updated });
  }

  const hbMatch = pathname.match(/^\/api\/heartbeats\/([^\/]+)$/) || pathname.match(/^\/api\/monitors\/([^\/]+)\/heartbeats$/);
  if (hbMatch && method === 'GET') {
    const id = hbMatch[1];
    const limit = Math.min(parseInt(parsedUrl.searchParams.get('limit') || '100', 10), 500);
    const heartbeats = db.getHeartbeats(id, limit);
    return sendJson(res, 200, { heartbeats });
  }

  if (pathname === '/api/incidents' && method === 'GET') {
    return sendJson(res, 200, { incidents: db.getIncidents() });
  }

  if (pathname === '/api/incidents' && method === 'POST') {
    const body = await parseBody(req);
    let monitorName = 'System Component';
    if (body.monitorId) {
      const m = db.getMonitor(body.monitorId);
      if (m) monitorName = m.name;
    }
    const newInc = db.createIncident({
      ...body,
      monitorName,
    });
    return sendJson(res, 201, { incident: newInc });
  }

  const incUpdateMatch = pathname.match(/^\/api\/incidents\/([^\/]+)\/updates$/);
  if (incUpdateMatch && method === 'POST') {
    const id = incUpdateMatch[1];
    const body = await parseBody(req);
    if (!body.status || !body.message) {
      return sendJson(res, 400, { error: 'Status and message are required' });
    }
    const updated = db.addIncidentUpdate(id, body.status, body.message);
    return updated ? sendJson(res, 200, { incident: updated }) : sendJson(res, 404, { error: 'Incident not found' });
  }

  if (pathname === '/api/notifications' && method === 'GET') {
    return sendJson(res, 200, { notifications: db.getNotifications() });
  }

  if (pathname === '/api/notifications' && method === 'POST') {
    const body = await parseBody(req);
    if (!body.name || !body.type) {
      return sendJson(res, 400, { error: 'Name and type are required' });
    }
    const newNotif = db.createNotification(body);
    return sendJson(res, 201, { notification: newNotif });
  }

  const notifMatch = pathname.match(/^\/api\/notifications\/([^\/]+)$/);
  if (notifMatch) {
    const id = notifMatch[1];
    if (method === 'PUT') {
      const body = await parseBody(req);
      const updated = db.updateNotification(id, body);
      return updated ? sendJson(res, 200, { notification: updated }) : sendJson(res, 404, { error: 'Not found' });
    }
    if (method === 'DELETE') {
      const deleted = db.deleteNotification(id);
      return deleted ? sendJson(res, 200, { success: true }) : sendJson(res, 404, { error: 'Not found' });
    }
  }

  const notifTestMatch = pathname.match(/^\/api\/notifications\/([^\/]+)\/test$/);
  if (notifTestMatch && method === 'POST') {
    const id = notifTestMatch[1];
    const channel = db.getNotification(id);
    if (!channel) return sendJson(res, 404, { error: 'Notification channel not found' });
    const result = await testNotificationChannel(channel);
    return sendJson(res, result.success ? 200 : 400, result);
  }

  if (pathname === '/api/status-page/public' && method === 'GET') {
    const config = db.getPublicStatusConfig();
    const monitors = db.getMonitors().filter(m => !m.paused);
    const activeIncidents = db.getActiveIncidents();
    const pastIncidents = db.getIncidents().filter(i => i.status === 'RESOLVED').slice(0, 5);

    const groups = {};
    for (const mon of monitors) {
      const groupName = mon.group || 'Core Services';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(mon);
    }

    const hasDown = monitors.some(m => m.status === 'DOWN');
    const hasDegraded = monitors.some(m => m.status === 'DEGRADED') || activeIncidents.length > 0;
    let overallStatus = 'OPERATIONAL';
    if (hasDown) {
      overallStatus = 'OUTAGE';
    } else if (hasDegraded) {
      overallStatus = 'DEGRADED';
    }

    const uptimes = monitors.map(m => m.uptime30d || 100);
    const avgUptime = uptimes.length > 0
      ? Number((uptimes.reduce((a, b) => a + b, 0) / uptimes.length).toFixed(2))
      : 100;

    const monitorBars = {};
    for (const mon of monitors) {
      const heartbeats = db.getHeartbeats(mon.id, 45);
      monitorBars[mon.id] = heartbeats.map(h => ({
        status: h.status,
        latency: h.latency,
        timestamp: h.timestamp,
      }));
    }

    return sendJson(res, 200, {
      config,
      overallStatus,
      avgUptime,
      monitors,
      groups,
      monitorBars,
      activeIncidents,
      pastIncidents,
    });
  }

  if (pathname === '/api/status-page/config' && method === 'GET') {
    return sendJson(res, 200, { config: db.getPublicStatusConfig() });
  }

  if (pathname === '/api/status-page/config' && method === 'PUT') {
    const body = await parseBody(req);
    return sendJson(res, 200, { config: db.updatePublicStatusConfig(body) });
  }

  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    return res.end(content);
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n======================================================`);
  console.log(`🚀 PulseGuard Monitor Server running at: http://localhost:${PORT}`);
  console.log(`📡 Background worker ping engine active`);
  console.log(`🌐 Public Status Page: http://localhost:${PORT}/#/status`);
  console.log(`======================================================\n`);
  worker.start();
});

process.on('SIGINT', () => {
  console.log('\nShutting down PulseGuard...');
  worker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down PulseGuard...');
  worker.stop();
  process.exit(0);
});
