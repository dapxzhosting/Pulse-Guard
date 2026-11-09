export type MonitorStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'PAUSED' | 'PENDING';
export type MonitorMethod = 'GET' | 'POST' | 'HEAD' | 'PUT' | 'PATCH';

export interface SslInfo {
  valid: boolean;
  issuer?: string;
  subject?: string;
  validFrom?: string;
  validTo?: string;
  daysRemaining?: number;
  error?: string;
  fingerprint?: string;
}

export interface LatencyBreakdown {
  dns?: number;
  tcp?: number;
  tls?: number;
  ttfb?: number;
  total: number;
}

export interface Heartbeat {
  id: string;
  monitorId: string;
  status: 'UP' | 'DOWN';
  statusCode?: number;
  statusText?: string;
  latency: number;
  latencyBreakdown?: LatencyBreakdown;
  message?: string;
  ssl?: SslInfo;
  timestamp: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  method: MonitorMethod;
  interval: number;
  timeout: number;
  expectedStatus: number;
  keyword?: string;
  headers?: Record<string, string>;
  body?: string;
  paused: boolean;
  status: MonitorStatus;
  lastChecked?: string;
  uptime24h?: number;
  uptime7d?: number;
  uptime30d?: number;
  avgLatency24h?: number;
  consecutiveFails: number;
  consecutiveSuccesses: number;
  sslCheckEnabled: boolean;
  sslAlertDaysThreshold?: number;
  sslInfo?: SslInfo;
  createdAt: string;
  group?: string;
  notificationChannels?: string[];
  lastStatusChange?: string;
}

export interface IncidentUpdate {
  id: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  message: string;
  timestamp: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  monitorName: string;
  title: string;
  status: 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';
  cause?: string;
  startedAt: string;
  resolvedAt?: string;
  updates: IncidentUpdate[];
}

export interface NotificationChannel {
  id: string;
  name: string;
  type: 'discord' | 'telegram' | 'email' | 'webhook';
  enabled: boolean;
  config: {
    discordWebhookUrl?: string;
    telegramBotToken?: string;
    telegramChatId?: string;
    emailRecipient?: string;
    webhookUrl?: string;
  };
  events: ('down' | 'up' | 'ssl_warning')[];
}

export interface PublicStatusConfig {
  title: string;
  description: string;
  customLogo?: string;
  announcement?: {
    enabled: boolean;
    type: 'info' | 'warning' | 'danger';
    message: string;
  };
  showUptimeDays: number;
}

export interface DatabaseSchema {
  monitors: Monitor[];
  heartbeats: Heartbeat[];
  incidents: Incident[];
  notifications: NotificationChannel[];
  publicStatusConfig: PublicStatusConfig;
}
