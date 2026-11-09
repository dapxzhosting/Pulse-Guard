import React, { useState } from 'react';
import { Play, Pause, RefreshCw, Trash2, Edit3, ExternalLink, Globe } from 'lucide-react';
import { Monitor } from '../types';
import { UptimeBar } from './UptimeBar';
import { SslBadge } from './SslBadge';

interface MonitorCardProps {
  monitor: Monitor;
  heartbeats?: { status: string; latency?: number; timestamp: string }[];
  onCheckNow: (id: string) => Promise<void>;
  onTogglePause: (id: string) => Promise<void>;
  onEdit: (monitor: Monitor) => void;
  onDelete: (id: string) => Promise<void>;
  onSelect: (monitor: Monitor) => void;
}

export const MonitorCard: React.FC<MonitorCardProps> = ({
  monitor,
  heartbeats = [],
  onCheckNow,
  onTogglePause,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const [checking, setChecking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isUp = monitor.status === 'UP';
  const isDown = monitor.status === 'DOWN';
  const isPaused = monitor.paused;

  const handleCheck = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setChecking(true);
      await onCheckNow(monitor.id);
    } finally {
      setChecking(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onTogglePause(monitor.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete monitor "${monitor.name}"?`)) {
      setDeleting(true);
      await onDelete(monitor.id);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(monitor);
  };

  return (
    <div
      onClick={() => onSelect(monitor)}
      className="glass-panel rounded-2xl p-5 transition-all duration-200 cursor-pointer hover:border-slate-700 shadow-sm group"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="relative mt-1 flex-shrink-0">
            {isPaused ? (
              <span className="w-3.5 h-3.5 rounded-full bg-slate-500 block" title="Monitor Paused" />
            ) : isUp ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 block" />
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping opacity-60" />
              </>
            ) : isDown ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 block" />
                <span className="w-3.5 h-3.5 rounded-full bg-rose-400 absolute inset-0 animate-ping opacity-75" />
              </>
            ) : (
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 block" title="Pending check" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                {monitor.name}
              </h3>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                {monitor.method}
              </span>
              {monitor.group && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  {monitor.group}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-400 truncate">
              <a
                href={monitor.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="hover:text-slate-200 flex items-center gap-1 font-mono truncate max-w-sm"
              >
                <Globe className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />
                <span className="truncate">{monitor.url}</span>
                <ExternalLink className="w-3 h-3 opacity-60 flex-shrink-0" />
              </a>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-slate-400">{monitor.interval}s check interval</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
          <SslBadge
            sslInfo={monitor.sslInfo}
            enabled={monitor.sslCheckEnabled}
            alertThreshold={monitor.sslAlertDaysThreshold}
          />

          <div className="text-right min-w-[70px]">
            <div className="text-[11px] text-slate-400 font-medium">Avg Latency</div>
            <div className="text-sm font-semibold text-white font-mono">
              {monitor.avgLatency24h ? `${monitor.avgLatency24h}ms` : '0 ms'}
            </div>
          </div>

          <div className="text-right min-w-[80px]">
            <div className="text-[11px] text-slate-400 font-medium">30d Uptime</div>
            <div
              className={`text-sm font-bold font-mono ${
                (monitor.uptime30d || 100) >= 99.5
                  ? 'text-emerald-400'
                  : (monitor.uptime30d || 100) >= 95
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {monitor.uptime30d ? `${monitor.uptime30d.toFixed(2)}%` : '100%'}
            </div>
          </div>

          <div className="flex items-center gap-1 border-l border-slate-800 pl-3">
            <button
              onClick={handleCheck}
              disabled={checking || isPaused}
              title="Ping monitor now"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={handleToggle}
              title={isPaused ? 'Resume monitoring' : 'Pause monitoring'}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {isPaused ? (
                <Play className="w-4 h-4 text-emerald-400" />
              ) : (
                <Pause className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <button
              onClick={handleEditClick}
              title="Edit configuration"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              onClick={handleDelete}
              disabled={deleting}
              title="Delete monitor"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60">
        <UptimeBar
          heartbeats={heartbeats}
          count={35}
          uptimePercentage={monitor.uptime30d ?? 100}
        />
      </div>
    </div>
  );
};
