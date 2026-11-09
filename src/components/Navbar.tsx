import React from 'react';
import { Activity, AlertCircle, Bell, ExternalLink, Plus, LayoutDashboard, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'monitors' | 'incidents' | 'alerts';
  setActiveTab: (tab: 'monitors' | 'incidents' | 'alerts') => void;
  onOpenNewMonitor: () => void;
  onOpenPublicStatus: () => void;
  activeIncidentsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewMonitor,
  onOpenPublicStatus,
  activeIncidentsCount,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('monitors')}>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/20">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">PulseGuard</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  ONLINE
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Uptime & Health Monitor</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('monitors')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'monitors'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Monitors</span>
            </button>

            <button
              onClick={() => setActiveTab('incidents')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all relative ${
                activeTab === 'incidents'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Incidents</span>
              {activeIncidentsCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {activeIncidentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                activeTab === 'alerts'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-sky-400" />
              <span>Alerts & Webhooks</span>
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPublicStatus}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 transition-colors"
          >
            <span>Public Status Page</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>

          <button
            onClick={onOpenNewMonitor}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Monitor</span>
          </button>
        </div>
      </div>
    </header>
  );
};
