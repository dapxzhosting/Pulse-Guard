import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowLeft, RefreshCw, Clock, Zap } from 'lucide-react';
import { api } from '../services/api';
import { UptimeBar } from './UptimeBar';

interface PublicStatusPageProps {
  onBackToDashboard?: () => void;
}

export const PublicStatusPage: React.FC<PublicStatusPageProps> = ({ onBackToDashboard }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getPublicStatus();
      setData(res);
    } catch (err) {
      console.error('Failed to load public status', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#070a12] flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading public status...</span>
        </div>
      </div>
    );
  }

  const overallStatus = data?.overallStatus || 'OPERATIONAL';
  const config = data?.config;
  const groups: Record<string, any[]> = data?.groups || {};
  const monitorBars = data?.monitorBars || {};
  const activeIncidents = data?.activeIncidents || [];
  const pastIncidents = data?.pastIncidents || [];

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between">
      <div className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              <Zap className="w-4 h-4 fill-emerald-400/20" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">{config?.title || 'System Status'}</h1>
              <p className="text-[11px] text-slate-400">Live Infrastructure Health</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              title="Refresh status"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <div
          className={`rounded-2xl p-6 border transition-all ${
            overallStatus === 'OPERATIONAL'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : overallStatus === 'DEGRADED'
              ? 'bg-amber-500/10 border-amber-500/30'
              : 'bg-rose-500/10 border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3.5">
              {overallStatus === 'OPERATIONAL' ? (
                <CheckCircle2 className="w-9 h-9 text-emerald-400" />
              ) : overallStatus === 'DEGRADED' ? (
                <AlertTriangle className="w-9 h-9 text-amber-400" />
              ) : (
                <XCircle className="w-9 h-9 text-rose-400" />
              )}
              <div>
                <h2 className="text-xl font-bold text-white">
                  {overallStatus === 'OPERATIONAL'
                    ? 'All Systems Operational'
                    : overallStatus === 'DEGRADED'
                    ? 'Partially Degraded Performance'
                    : 'Active Outage Detected'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  {overallStatus === 'OPERATIONAL'
                    ? 'All web applications, APIs, and infrastructure checks are operating within normal parameters.'
                    : 'Some monitored endpoints are experiencing elevated latency or outages.'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block">30-Day Aggregate Uptime</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {data?.avgUptime ?? 100}%
              </span>
            </div>
          </div>
        </div>

        {config?.announcement?.enabled && config?.announcement?.message && (
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-start gap-3">
            <span className="text-sky-400 font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 mt-0.5">
              Notice
            </span>
            <p className="flex-1">{config.announcement.message}</p>
          </div>
        )}

        {activeIncidents.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Ongoing Incidents</span>
            </h3>

            {activeIncidents.map((inc: any) => (
              <div key={inc.id} className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-bold text-white">{inc.title}</h4>
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 font-mono">
                    {inc.status}
                  </span>
                </div>
                <div className="border-l-2 border-slate-800 ml-2 space-y-3 pl-4">
                  {inc.updates.map((up: any) => (
                    <div key={up.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-500 border-2 border-slate-900" />
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(up.timestamp).toLocaleString()}
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{up.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            System Metrics & Service Health
          </h3>

          {Object.entries(groups).map(([groupName, monitors]) => (
            <div key={groupName} className="glass-panel rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-200">{groupName}</h4>
                <span className="text-xs text-slate-400 font-mono">{monitors.length} services</span>
              </div>

              <div className="divide-y divide-slate-800/60">
                {monitors.map((mon: any) => {
                  const isUp = mon.status === 'UP';
                  const bars = monitorBars[mon.id] || [];

                  return (
                    <div key={mon.id} className="p-5 space-y-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isUp ? 'bg-emerald-400 shadow-md shadow-emerald-500/50' : 'bg-rose-500 shadow-md shadow-rose-500/50'
                            }`}
                          />
                          <div>
                            <span className="text-sm font-semibold text-white">{mon.name}</span>
                            <span className="text-xs text-slate-500 ml-2 font-mono">{mon.avgLatency24h ? `${mon.avgLatency24h}ms avg` : ''}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                              isUp
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                            }`}
                          >
                            {isUp ? 'Operational' : 'Major Outage'}
                          </span>
                        </div>
                      </div>

                      <UptimeBar
                        heartbeats={bars}
                        count={35}
                        uptimePercentage={mon.uptime30d ?? 100}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {pastIncidents.length > 0 && (
          <div className="space-y-3 pt-6 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              <span>Resolved Incidents History</span>
            </h3>

            <div className="space-y-2.5">
              {pastIncidents.map((inc: any) => (
                <div key={inc.id} className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-200">{inc.title}</span>
                    <span className="text-slate-500 ml-2">({inc.monitorName})</span>
                  </div>
                  <span className="text-slate-400 font-mono">
                    {new Date(inc.startedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        Powered by PulseGuard | Real-time Uptime Engine
      </footer>
    </div>
  );
};
