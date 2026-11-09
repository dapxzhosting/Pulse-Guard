import tls from 'node:tls';

export async function dispatchAlert(channel, event) {
  if (!channel.enabled) {
    return { success: false, error: 'Channel is disabled' };
  }

  if (channel.events && !channel.events.includes(event.type)) {
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

async function sendDiscordWebhook(channel, event) {
  const webhookUrl = channel.config.discordWebhookUrl;
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, error: 'Invalid or missing Discord Webhook URL' };
  }

  const isDown = event.type === 'down';
  const isUp = event.type === 'up';

  const color = isDown ? 0xef4444 : isUp ? 0x10b981 : 0xf59e0b;
  const title = isDown
    ? `Monitor DOWN: ${event.monitor.name}`
    : isUp
    ? `Monitor RECOVERED: ${event.monitor.name}`
    : `SSL Expiry Warning: ${event.monitor.name}`;

  const description = isDown
    ? `URL: ${event.monitor.url}\nReason: ${event.message || 'Service unreachable'}\nStatus Code: ${event.statusCode || 'N/A'}`
    : isUp
    ? `URL: ${event.monitor.url}\nStatus: Service is back online and responding normally.\nDowntime Duration: ${event.downtimeDurationText || 'A few moments'}`
    : `URL: ${event.monitor.url}\nNotice: ${event.message || 'SSL Certificate is approaching its expiration date.'}`;

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
          { name: 'Interval', value: `${event.monitor.interval || 60}s`, inline: true },
          { name: 'Timestamp', value: new Date(event.timestamp).toLocaleString(), inline: true },
        ],
        footer: {
          text: 'PulseGuard Monitor | Real-time Uptime Engine',
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
  } catch (err) {
    return { success: false, error: `Failed to dispatch to Discord: ${err.message}` };
  }
}

async function sendTelegramMessage(channel, event) {
  const { telegramBotToken, telegramChatId } = channel.config;
  if (!telegramBotToken || !telegramChatId) {
    return { success: false, error: 'Missing Telegram Bot Token or Chat ID' };
  }

  const isDown = event.type === 'down';
  const isUp = event.type === 'up';

  const statusHeader = isDown ? 'MONITOR IS DOWN' : isUp ? 'MONITOR RECOVERED' : 'SSL CERTIFICATE WARNING';

  const text = `<b>[${statusHeader}]</b>\n\n` +
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

    const data = await res.json();
    if (!data.ok) {
      return { success: false, error: `Telegram error: ${data.description}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: `Telegram dispatch failed: ${err.message}` };
  }
}

async function sendGenericWebhook(channel, event) {
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
  } catch (err) {
    return { success: false, error: `Webhook request failed: ${err.message}` };
  }
}

async function sendEmailAlert(channel, event) {
  const recipient = channel.config.emailRecipient;
  if (!recipient || !recipient.includes('@')) {
    return { success: false, error: 'Email tujuan tidak valid' };
  }

  const isDown = event.type === 'down';
  const isUp = event.type === 'up';

  const subject = isDown
    ? `[ALERT] Monitor DOWN: ${event.monitor.name}`
    : isUp
    ? `[RESOLVED] Monitor RECOVERED: ${event.monitor.name}`
    : `[WARNING] SSL Expiry: ${event.monitor.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; background: #070a12; color: #f8fafc; padding: 24px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1e293b;">
      <h2 style="color: ${isDown ? '#ef4444' : isUp ? '#10b981' : '#f59e0b'}; margin-top: 0;">
        ${subject}
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
        <strong>Target Service:</strong> ${escapeHtml(event.monitor.name)}<br/>
        <strong>Target URL:</strong> <a href="${escapeHtml(event.monitor.url)}" style="color: #38bdf8;">${escapeHtml(event.monitor.url)}</a><br/>
        <strong>Status Code:</strong> ${event.statusCode || 'N/A'}<br/>
        <strong>Details:</strong> ${escapeHtml(event.message || 'Status check transition')}<br/>
        ${event.downtimeDurationText ? `<strong>Downtime Duration:</strong> ${event.downtimeDurationText}<br/>` : ''}
        <strong>Timestamp:</strong> ${new Date(event.timestamp).toLocaleString()}<br/>
      </p>
      <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
      <p style="font-size: 11px; color: #64748b;">
        PulseGuard Uptime Engine | Automated Notification Dispatcher
      </p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const fromAddr = process.env.RESEND_FROM || 'PulseGuard <onboarding@resend.dev>';
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [recipient.trim()],
          subject,
          html,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        return { success: false, error: `Resend API Error: ${errJson.message || res.statusText}` };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: `Resend request failed: ${err.message}` };
    }
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      await sendNativeSmtp({
        host: smtpHost.trim(),
        port: smtpPort,
        user: smtpUser.trim(),
        pass: smtpPass.trim(),
        from: smtpFrom,
        to: recipient.trim(),
        subject,
        html,
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: `SMTP Send Error: ${err.message}` };
    }
  }

  return {
    success: false,
    error: 'Email tidak terkirim: Konfigurasi pengirim belum diatur di server. Tambahkan SMTP_HOST/SMTP_USER/SMTP_PASS atau RESEND_API_KEY di file .env lalu restart server.',
  };
}

function sendNativeSmtp({ host, port, user, pass, from, to, subject, html }) {
  const displayFrom = from || `PulseGuard <${user}>`;
  const mailFrom = user;
  return new Promise((resolve, reject) => {
    const socket = tls.connect({
      host,
      port,
      rejectUnauthorized: false,
    });

    let step = 0;
    let buffer = '';

    const send = (cmd) => {
      socket.write(cmd + '\r\n');
    };

    socket.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\r\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.trim()) continue;
        const code = parseInt(line.substring(0, 3), 10);
        if (line.charAt(3) === '-') continue;

        if (step === 0 && code === 220) {
          step = 1;
          send('EHLO localhost');
        } else if (step === 1 && code === 250) {
          step = 2;
          send('AUTH LOGIN');
        } else if (step === 2 && code === 334) {
          step = 3;
          send(Buffer.from(user).toString('base64'));
        } else if (step === 3 && code === 334) {
          step = 4;
          send(Buffer.from(pass).toString('base64'));
        } else if (step === 4 && (code === 235 || code === 250)) {
          step = 5;
          send(`MAIL FROM:<${mailFrom}>`);
        } else if (step === 5 && code === 250) {
          step = 6;
          send(`RCPT TO:<${to}>`);
        } else if (step === 6 && code === 250) {
          step = 7;
          send('DATA');
        } else if (step === 7 && code === 354) {
          step = 8;
          const emailData = [
            `From: ${displayFrom}`,
            `To: <${to}>`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=UTF-8',
            '',
            html,
            '.',
          ].join('\r\n');
          send(emailData);
        } else if (step === 8 && code === 250) {
          step = 9;
          send('QUIT');
          socket.end();
          resolve({ success: true });
        } else if (code >= 400) {
          socket.end();
          reject(new Error(`SMTP error ${code}: ${line}`));
        }
      }
    });

    socket.on('error', (err) => {
      reject(new Error(`Koneksi SMTP gagal: ${err.message}`));
    });

    socket.setTimeout(12000, () => {
      socket.destroy();
      reject(new Error('Koneksi SMTP timeout setelah 12 detik'));
    });
  });
}

export async function testNotificationChannel(channel) {
  const dummyMonitor = {
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

  const testEvent = {
    type: 'down',
    monitor: dummyMonitor,
    statusCode: 503,
    message: 'TEST ALERT: Service Unavailable (uji coba notifikasi PulseGuard)',
    timestamp: new Date().toISOString(),
  };

  return dispatchAlert(channel, testEvent);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
