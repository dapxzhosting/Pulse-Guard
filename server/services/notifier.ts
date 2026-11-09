import { Monitor, NotificationChannel } from '../types.js';

export interface AlertEvent {
  type: 'down' | 'up' | 'ssl_warning';
  monitor: Monitor;
  message?: string;
  statusCode?: number;
  downtimeDurationText?: string;
  timestamp: string;
}

export async function dispatchAlert(channel: NotificationChannel, event: AlertEvent): Promise<{ success: boolean; error?: string }> {
  if (!channel.enabled) {
    return { success: false, error: 'Channel is disabled' };
  }

  if (!channel.events.includes(event.type)) {
    return { success: false, error: `Channel not subscribed to event: ${event.type}` };
  }

  switch (channel.type) {
    case 'discord':
      return sendDiscordWebhook(channel, event);
    case 'telegram':
      return sendTelegramMessage(channel, event);
    case 'webhook':
      return sendGenericWebhook(channel, event);
    case 'email':
      return sendEmailAlert(channel, event);
    default:
      return { success: false, error: `Unsupported channel type: ${channel.type}` };
  }
}

async function sendDiscordWebhook(channel: NotificationChannel, event: AlertEvent): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = channel.config.discordWebhookUrl;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, error: 'Invalid or missing Discord Webhook URL' };
  }

  const isDown = event.type === 'down';
  const isUp = event.type === 'up';
  const isSsl = event.type === 'ssl_warning';

  const color = isDown ? 0xef4444 : isUp ? 0x10b981 : 0xf59e0b;
  const title = isDown
    ? `🔴 Monitor DOWN: ${event.monitor.name}`
    : isUp
    ? `🟢 Monitor RECOVERED: ${event.monitor.name}`
    : `⚠️ SSL Expiry Warning: ${event.monitor.name}`;

  const description = isDown
    ? `**URL:** ${event.monitor.url}\n**Reason:** ${event.message || 'Service unreachable'}\n**Status Code:** ${event.statusCode || 'N/A'}`
    : isUp
    ? `**URL:** ${event.monitor.url}\n**Status:** Service is back online and responding normally.\n**Downtime Duration:** ${event.downtimeDurationText || 'A few moments'}`
    : `**URL:** ${event.monitor.url}\n**Notice:** ${event.message || 'SSL Certificate is approaching its expiration date.'}`;

  const payload = {
    username: 'PulseGuard Uptime',
    avatar_url: 'https://cdn-icons-png.flaticon.com/512/9446/9446864.png',
    embeds: [
      {
        title,
        description,
        color,
        fields: [
          { name: 'Target URL', value: event.monitor.url, inline: true },
          { name: 'Interval', value: `${event.monitor.interval}s`, inline: true },
          { name: 'Timestamp', value: new Date(event.timestamp).toLocaleString(), inline: true },
        ],
        footer: {
          text: 'PulseGuard Monitor • BetterStack & UptimeRobot Engine',
        },
        timestamp: event.timestamp,
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: `Discord responded with HTTP ${res.status}: ${errText}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Failed to dispatch to Discord: ${err.message}` };
  }
}

async function sendTelegramMessage(channel: NotificationChannel, event: AlertEvent): Promise<{ success: boolean; error?: string }> {
  const { telegramBotToken, telegramChatId } = channel.config;
  if (!telegramBotToken || !telegramChatId) {
    return { success: false, error: 'Missing Telegram Bot Token or Chat ID' };
  }

  const isDown = event.type === 'down';
  const isUp = event.type === 'up';

  const icon = isDown ? '🚨' : isUp ? '✅' : '⚠️';
  const statusHeader = isDown ? 'MONITOR IS DOWN' : isUp ? 'MONITOR RECOVERED' : 'SSL CERTIFICATE WARNING';

  const text = `${icon} <b>${statusHeader}</b>\n\n` +
    `<b>Monitor:</b> ${escapeHtml(event.monitor.name)}\n` +
    `<b>URL:</b> <code>${escapeHtml(event.monitor.url)}</code>\n` +
    `<b>Details:</b> ${escapeHtml(event.message || 'Check failed')}\n` +
    (event.downtimeDurationText ? `<b>Downtime:</b> ${event.downtimeDurationText}\n` : '') +
    `<b>Time:</b> ${new Date(event.timestamp).toUTCString()}`;

  const apiUrl = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data: any = await res.json();
    if (!data.ok) {
      return { success: false, error: `Telegram error: ${data.description}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Telegram dispatch failed: ${err.message}` };
  }
}

async function sendGenericWebhook(channel: NotificationChannel, event: AlertEvent): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = channel.config.webhookUrl;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, error: 'Invalid Webhook URL' };
  }

  const payload = {
    event: event.type,
    timestamp: event.timestamp,
    monitor: {
      id: event.monitor.id,
      name: event.monitor.name,
      url: event.monitor.url,
      method: event.monitor.method,
      status: event.monitor.status,
    },
    details: {
      statusCode: event.statusCode,
      message: event.message,
      downtimeDurationText: event.downtimeDurationText,
    },
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'PulseGuard-Alert-Webhook/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, error: `Webhook endpoint returned HTTP ${res.status}` };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: `Webhook request failed: ${err.message}` };
  }
}

async function sendEmailAlert(channel: NotificationChannel, event: AlertEvent): Promise<{ success: boolean; error?: string }> {
  const recipient = channel.config.emailRecipient;
  if (!recipient || !recipient.includes('@')) {
    return { success: false, error: 'Invalid recipient email address' };
  }

  console.log(`[EMAIL ALERT SIMULATOR] Dispatching alert to ${recipient}:`, {
    type: event.type,
    monitor: event.monitor.name,
    message: event.message,
    time: event.timestamp,
  });

  return { success: true };
}

export async function testNotificationChannel(channel: NotificationChannel): Promise<{ success: boolean; error?: string }> {
  const dummyMonitor: Monitor = {
    id: 'test-mon',
    name: 'Demo Production API',
    url: 'https://api.example.com/health',
    method: 'GET',
    interval: 60,
    timeout: 10,
    expectedStatus: 200,
    paused: false,
    status: 'DOWN',
    consecutiveFails: 2,
    consecutiveSuccesses: 0,
    sslCheckEnabled: true,
    createdAt: new Date().toISOString(),
  };

  const testEvent: AlertEvent = {
    type: 'down',
    monitor: dummyMonitor,
    statusCode: 503,
    message: 'TEST ALERT: Service Unavailable (simulated test notification from PulseGuard)',
    timestamp: new Date().toISOString(),
  };

  return dispatchAlert(channel, testEvent);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
