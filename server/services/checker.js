import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns/promises';
import { URL } from 'node:url';

export async function lookupIpInfo(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    let ip = null;
    try {
      const result = await dns.lookup(hostname, { family: 4 });
      ip = result.address;
    } catch {
      return null;
    }

    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,asname,reverse,query`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 'success') return null;

    return {
      ip: data.query,
      hostname: data.reverse || hostname,
      isp: data.isp,
      org: data.org,
      asn: data.as,
      asnName: data.asname,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      zip: data.zip,
      timezone: data.timezone,
      lat: data.lat,
      lon: data.lon,
      fetchedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export async function pingMonitor(monitor) {
  return new Promise((resolve) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(monitor.url);
    } catch (err) {
      return resolve({
        status: 'DOWN',
        latency: 0,
        latencyBreakdown: { total: 0 },
        message: `Invalid URL: ${err.message}`,
      });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const timeoutMs = (monitor.timeout || 10) * 1000;

    const timings = {
      start: 0,
      dns: 0,
      tcp: 0,
      tls: 0,
      ttfb: 0,
      end: 0,
    };

    timings.start = performance.now();

    const headers = {
      'User-Agent': 'PulseGuard-UptimeBot/1.0 (+https://pulseguard.io)',
      'Accept': '*/*',
      ...(monitor.headers || {}),
    };

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: monitor.method || 'GET',
      headers,
      timeout: timeoutMs,
      rejectUnauthorized: false,
    };

    let resolved = false;
    const finish = (result) => {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    };

    const req = client.request(options, (res) => {
      timings.ttfb = performance.now();

      let bodyData = '';
      res.setEncoding('utf8');

      res.on('data', (chunk) => {
        if (bodyData.length < 5000) {
          bodyData += chunk;
        }
      });

      res.on('end', () => {
        timings.end = performance.now();

        const totalLatency = Math.max(1, Math.round(timings.end - timings.start));
        const dnsTime = timings.dns ? Math.round(timings.dns - timings.start) : 0;
        const tcpTime = timings.tcp && timings.dns ? Math.round(timings.tcp - timings.dns) : 0;
        const tlsTime = timings.tls && timings.tcp ? Math.round(timings.tls - timings.tcp) : 0;
        const ttfbTime = timings.ttfb ? Math.round(timings.ttfb - (timings.tls || timings.tcp || timings.start)) : 0;

        const breakdown = {
          dns: Math.max(0, dnsTime),
          tcp: Math.max(0, tcpTime),
          tls: Math.max(0, tlsTime),
          ttfb: Math.max(0, ttfbTime),
          total: totalLatency,
        };

        const statusCode = res.statusCode || 0;
        const statusText = res.statusMessage || '';

        const expectedStatus = Number(monitor.expectedStatus) || 200;
        const isStatusOk = statusCode === expectedStatus || (expectedStatus === 200 && statusCode >= 200 && statusCode < 300);

        let keywordOk = true;
        let failureReason = '';

        if (!isStatusOk) {
          failureReason = `Expected HTTP ${expectedStatus}, received ${statusCode} (${statusText})`;
        } else if (monitor.keyword && monitor.keyword.trim() !== '') {
          if (!bodyData.includes(monitor.keyword.trim())) {
            keywordOk = false;
            failureReason = `Response body did not contain keyword "${monitor.keyword}"`;
          }
        }

        const isUp = isStatusOk && keywordOk;

        finish({
          status: isUp ? 'UP' : 'DOWN',
          statusCode,
          statusText,
          latency: totalLatency,
          latencyBreakdown: breakdown,
          message: isUp ? `HTTP ${statusCode} ${statusText}` : failureReason,
          responseSnippet: bodyData.substring(0, 500),
        });
      });
    });

    req.on('socket', (socket) => {
      socket.on('lookup', () => {
        timings.dns = performance.now();
      });

      socket.on('connect', () => {
        timings.tcp = performance.now();
      });

      socket.on('secureConnect', () => {
        timings.tls = performance.now();
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const totalLatency = Math.round(performance.now() - timings.start);
      finish({
        status: 'DOWN',
        latency: totalLatency,
        latencyBreakdown: { total: totalLatency },
        message: `Request timed out after ${monitor.timeout || 10} seconds`,
      });
    });

    req.on('error', (err) => {
      const totalLatency = Math.round(performance.now() - timings.start);
      finish({
        status: 'DOWN',
        latency: totalLatency,
        latencyBreakdown: { total: totalLatency },
        message: `Connection failed: ${err.code || err.message}`,
      });
    });

    if (monitor.body && ['POST', 'PUT', 'PATCH'].includes(monitor.method)) {
      req.write(monitor.body);
    }

    req.end();
  });
}
