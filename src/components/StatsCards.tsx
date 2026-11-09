import React from 'react';
import { Activity, CheckCircle2, XCircle, Clock, Zap } from 'lucide-react';
import { SystemStats } from '../types';

interface StatsCardsProps {
  stats: SystemStats | null;
  loading?: boolean;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats, loading }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Monitors</span>
          <Activity className="w-4 h-4 text-slate-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {loading ? '...' : stats?.totalMonitors ?? 0}
          </span>
          <span className="text-xs text-slate-400">active checks</span>
        </div>
      </div>

      <div className="glass-panel border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span>Operational</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-emerald-400 font-mono">
            {loading ? '...' : stats?.upMonitors ?? 0}
          </span>
          <span className="text-xs text-emerald-500/80">healthy</span>
        </div>
      </div>

      <div className="glass-panel border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-rose-400 text-xs font-semibold uppercase tracking-wider">
          <span>Outages</span>
          <XCircle className="w-4 h-4 text-rose-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-rose-400 font-mono">
            {loading ? '...' : stats?.downMonitors ?? 0}
          </span>
          <span className="text-xs text-rose-500/80">
            {(stats?.activeIncidents ?? 0) > 0 ? `${stats?.activeIncidents} active incident` : 'all operational'}
          </span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <span>24h Uptime</span>
          <Zap className="w-4 h-4 text-cyan-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {loading ? '...' : `${stats?.overallUptime ?? 100}%`}
          </span>
          <span className="text-xs text-emerald-400 font-medium">Target 99.9%</span>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <span>Avg Latency</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white font-mono">
            {loading ? '...' : `${stats?.avgLatency ?? 0}ms`}
          </span>
          <span className="text-xs text-slate-400">global response</span>
        </div>
      </div>
    </div>
  );
};
