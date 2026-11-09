import tls from 'node:tls';
import net from 'node:net';
import { URL } from 'node:url';

export async function checkSslCertificate(urlString, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let hostname;
    let port = 443;

    try {
      const parsed = new URL(urlString);
      if (parsed.protocol !== 'https:') {
        return resolve({
          valid: false,
          error: 'URL protocol is not HTTPS (no SSL certificate)',
        });
      }
      hostname = parsed.hostname;
      if (parsed.port) {
        port = parseInt(parsed.port, 10);
      }
    } catch (err) {
      return resolve({
        valid: false,
        error: `Invalid URL: ${err.message}`,
      });
    }

    const options = {
      host: hostname,
      port,
      rejectUnauthorized: false,
    };

    if (net.isIP(hostname) === 0) {
      options.servername = hostname;
    }

    let settled = false;
    const finish = (result) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      socket.destroy();
      finish({
        valid: false,
        error: 'SSL handshake connection timed out',
      });
    }, timeoutMs);

    const socket = tls.connect(options, () => {
      clearTimeout(timer);
      try {
        const cert = socket.getPeerCertificate(true);

        if (!cert || Object.keys(cert).length === 0) {
          socket.end();
          return finish({
            valid: false,
            error: 'No SSL certificate returned by host',
          });
        }

        const validFrom = cert.valid_from;
        const validTo = cert.valid_to;
        const validToTime = new Date(validTo).getTime();
        const now = Date.now();
        const diffMs = validToTime - now;
        const daysRemaining = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        const isExpired = diffMs <= 0;
        const isAuthorized = socket.authorized;
        const authError = socket.authorizationError ? String(socket.authorizationError) : undefined;

        const issuerString = typeof cert.issuer === 'object'
          ? (cert.issuer.O || cert.issuer.CN || 'Unknown CA')
          : String(cert.issuer || 'Unknown CA');

        const subjectString = typeof cert.subject === 'object'
          ? (cert.subject.CN || cert.subject.O || hostname)
          : String(cert.subject || hostname);

        socket.end();

        finish({
          valid: !isExpired && isAuthorized,
          issuer: issuerString,
          subject: subjectString,
          validFrom,
          validTo,
          daysRemaining,
          fingerprint: cert.fingerprint,
          error: isExpired ? 'Certificate has expired' : authError,
        });
      } catch (err) {
        socket.end();
        finish({
          valid: false,
          error: `Error parsing SSL certificate: ${err.message}`,
        });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timer);
      finish({
        valid: false,
        error: `TLS socket error: ${err.code || err.message}`,
      });
    });
  });
}
