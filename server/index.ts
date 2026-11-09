import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { monitorsRouter } from './routes/monitors.js';
import { heartbeatsRouter } from './routes/heartbeats.js';
import { incidentsRouter } from './routes/incidents.js';
import { notificationsRouter } from './routes/notifications.js';
import { statusPageRouter } from './routes/statusPage.js';
import { statsRouter } from './routes/stats.js';
import { worker } from './worker.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/monitors', monitorsRouter);
app.use('/api/heartbeats', heartbeatsRouter);
app.use('/api/incidents', incidentsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/status-page', statusPageRouter);
app.use('/api/stats', statsRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
});

const clientDist = path.resolve(__dirname, '../dist');
app.use(express.static(clientDist));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('PulseGuard Monitoring API Server running. Open Vite frontend on port 5173 for development.');
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`🚀 PulseGuard API Server listening on http://localhost:${PORT}`);
  console.log(`📡 Background monitoring worker active`);
  console.log(`🌐 Public Status Page: http://localhost:${PORT}/api/status-page/public`);
  console.log(`=================================================\n`);

  worker.start();
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  worker.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  worker.stop();
  process.exit(0);
});
