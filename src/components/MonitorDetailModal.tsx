import React, { useState } from 'react';
import { X, RefreshCw, Globe, Shield, Clock, Zap, AlertTriangle } from 'lucide-react';
import { Monitor, Heartbeat } from '../types';
import { LatencyChart } from './LatencyChart';

interface MonitorDetailModalProps {
  monitor: Monitor | null;
  heartbeats: Heartbeat[];
  onClose: () => void;
  onCheckNow: (id: string) => Promise<void>;
}

export const MonitorDetailModal: React.FC<MonitorDetailModalProps> = ({
  monitor,
  heartbeats,
  onClose,
  onCheckNow,
}) => {
  const [checking, setChecking] = useState(false);

  if (!monitor) return null;

  const isUp = monitor.status === 'UP';
  const latestHb = heartbeats[heartbeats.length - 1];
  const ssl = monitor.sslInfo;

  const handleCheck = async () => {
    try {
      setChecking(true);
      await onCheckNow(monitor.id);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isUp ? 'bg-emerald-400' : 'bg-rose-500'
              }`}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{monitor.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                  {monitor.method}
                </span>
                {monitor.group && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                    {monitor.group}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <a
                  href={monitor.url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  {monitor.url}
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheck}
              disabled={checking}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors flex items-center gap-1.5 disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking' : 'Check Now'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">24h Uptime</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {monitor.uptime24h ? `${monitor.uptime24h.toFixed(2)}%` : '100%'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">30d Uptime</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {monitor.uptime30d ? `${monitor.uptime30d.toFixed(2)}%` : '100%'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Avg Latency (24h)</span>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {monitor.avgLatency24h ? `${monitor.avgLatency24h}ms` : '0 ms'}
              </div>
            </div>
            <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Interval</span>
              <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                {monitor.interval}s
              </div>
            </div>
          </div>

          <LatencyChart heartbeats={heartbeats} height={200} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                <span>Response Time Breakdown</span>
              </h4>

              {latestHb?.latencyBreakdown ? (
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>DNS Lookup</span>
                    <span>{latestHb.latencyBreakdown.dns || 0} ms</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-sky-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((latestHb.latencyBreakdown.dns || 0) / (latestHb.latency || 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300 pt-1">
                    <span>TCP Handshake</span>
                    <span>{latestHb.latencyBreakdown.tcp || 0} ms</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((latestHb.latencyBreakdown.tcp || 0) / (latestHb.latency || 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300 pt-1">
                    <span>TLS / SSL Negotiation</span>
                    <span>{latestHb.latencyBreakdown.tls || 0} ms</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((latestHb.latencyBreakdown.tls || 0) / (latestHb.latency || 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-slate-300 pt-1">
                    <span>Server TTFB</span>
                    <span>{latestHb.latencyBreakdown.ttfb || 0} ms</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full"
                      style={{
                        width: `${Math.min(100, ((latestHb.latencyBreakdown.ttfb || 0) / (latestHb.latency || 1)) * 100)}%`,
                      }}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-between font-bold text-white text-xs">
                    <span>Total Latency</span>
                    <span className="text-emerald-400">{latestHb.latency} ms</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  No breakdown data captured yet.
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL Certificate Details</span>
              </h4>

              {monitor.sslCheckEnabled && ssl ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Common Name:</span>
                    <span className="text-white font-mono truncate max-w-[200px]">
                      {ssl.subject || 'Domain Cert'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Issuer CA:</span>
                    <span className="text-white truncate max-w-[200px]">
                      {ssl.issuer || 'Trusted Certificate Authority'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valid From:</span>
                    <span className="text-slate-300 font-mono">
                      {ssl.validFrom ? new Date(ssl.validFrom).toLocaleDateString() : 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Valid To:</span>
                    <span className="text-slate-300 font-mono">
                      {ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : 'None'}
                    </span>
                  </div>
                  {ssl.error && (
                    <div className="pt-2 text-rose-400 text-xs font-medium flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{ssl.error}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-2">
                  SSL certificate check is disabled or not applicable for non-HTTPS URL.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recent Heartbeat Logs (Last {heartbeats.length} checks)</span>
            </h4>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Response Time</th>
                    <th className="py-2.5 px-3">Message</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {heartbeats.slice(-15).reverse().map(hb => (
                    <tr key={hb.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            hb.status === 'UP'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              hb.status === 'UP' ? 'bg-emerald-400' : 'bg-rose-500'
                            }`}
                          />
                          {hb.status}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {hb.statusCode || 'N/A'}
                      </td>
                      <td className="py-2 px-3 text-white font-semibold">
                        {hb.latency} ms
                      </td>
                      <td className="py-2 px-3 text-slate-400 max-w-xs truncate font-sans">
                        {hb.message || 'Healthy response'}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-500 text-[11px]">
                        {new Date(hb.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
