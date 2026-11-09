import React, { useState } from 'react';
import { AlertTriangle, Plus, Check, Clock, MessageSquare, X } from 'lucide-react';
import { Incident } from '../types';

interface IncidentsViewProps {
  incidents: Incident[];
  onCreateIncident: (data: Partial<Incident>) => Promise<void>;
  onAddUpdate: (id: string, status: Incident['status'], message: string) => Promise<void>;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onCreateIncident,
  onAddUpdate,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeIncidentId, setActiveIncidentId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [cause, setCause] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [updateStatus, setUpdateStatus] = useState<Incident['status']>('INVESTIGATING');
  const [updateMessage, setUpdateMessage] = useState('');

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setLoading(true);
      await onCreateIncident({
        title,
        cause,
        status: 'INVESTIGATING',
        updates: initialMessage.trim()
          ? [
              {
                id: `up-${Date.now()}`,
                status: 'INVESTIGATING',
                message: initialMessage.trim(),
                timestamp: new Date().toISOString(),
              },
            ]
          : [],
      });
      setShowNewModal(false);
      setTitle('');
      setCause('');
      setInitialMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeIncidentId || !updateMessage.trim()) return;

    try {
      setLoading(true);
      await onAddUpdate(activeIncidentId, updateStatus, updateMessage);
      setActiveIncidentId(null);
      setUpdateMessage('');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Incident['status']) => {
    const config = {
      INVESTIGATING: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      IDENTIFIED: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      MONITORING: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
      RESOLVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${config[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Incidents & Outages</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track automated downtime alerts and manage customer-facing incident logs.
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Post Incident</span>
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>Active Outages ({activeIncidents.length})</span>
        </h3>

        {activeIncidents.length === 0 ? (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-2">
              <Check className="w-5 h-5" />
            </div>
            <h4 className="text-base font-semibold text-white">No active incidents</h4>
            <p className="text-xs text-slate-400 mt-1">
              All monitored web services and endpoints are operating normally without issues.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeIncidents.map(inc => (
              <div key={inc.id} className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(inc.status)}
                      <h4 className="text-base font-bold text-white">{inc.title}</h4>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Service: <strong className="text-slate-200">{inc.monitorName}</strong></span>
                      <span>|</span>
                      <span>Started: {new Date(inc.startedAt).toLocaleString()}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setActiveIncidentId(inc.id);
                      setUpdateStatus(inc.status);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Add Update</span>
                  </button>
                </div>

                <div className="mt-4 border-l-2 border-slate-800 ml-2 space-y-3 pl-4">
                  {inc.updates.map(up => (
                    <div key={up.id} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-slate-900" />
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-sky-400">{up.status}</span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(up.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">{up.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 pt-6 border-t border-slate-800">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Past Resolved Incidents ({resolvedIncidents.length})</span>
        </h3>

        {resolvedIncidents.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-2">No past incident archive.</div>
        ) : (
          <div className="space-y-2.5">
            {resolvedIncidents.map(inc => (
              <div
                key={inc.id}
                className="glass-panel rounded-xl p-4 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <h5 className="text-sm font-semibold text-slate-200">{inc.title}</h5>
                    <span className="text-xs text-slate-500">({inc.monitorName})</span>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Resolved
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-400 flex items-center gap-3 font-mono">
                  <span>Started: {new Date(inc.startedAt).toLocaleDateString()}</span>
                  <span>Duration: {inc.resolvedAt ? `${Math.round((new Date(inc.resolvedAt).getTime() - new Date(inc.startedAt).getTime()) / 60000)} mins` : 'None'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setShowNewModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Declare Manual Incident</h3>
              <button onClick={() => setShowNewModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Major degradation on Payment Gateway"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Root Cause</label>
                <input
                  type="text"
                  value={cause}
                  onChange={e => setCause(e.target.value)}
                  placeholder="e.g. Upstream cloud provider network failure"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Investigation Message</label>
                <textarea
                  rows={3}
                  value={initialMessage}
                  onChange={e => setInitialMessage(e.target.value)}
                  placeholder="Engineering team is actively investigating service disruptions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20"
                >
                  {loading ? 'Posting...' : 'Declare Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeIncidentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setActiveIncidentId(null)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Post Incident Status Update</h3>
              <button onClick={() => setActiveIncidentId(null)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Status</label>
                <select
                  value={updateStatus}
                  onChange={e => setUpdateStatus(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="INVESTIGATING">Investigating</option>
                  <option value="IDENTIFIED">Identified</option>
                  <option value="MONITORING">Monitoring</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Progress Message *</label>
                <textarea
                  rows={3}
                  required
                  value={updateMessage}
                  onChange={e => setUpdateMessage(e.target.value)}
                  placeholder="Detail the current status or remediation applied..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveIncidentId(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  {loading ? 'Submitting...' : 'Post Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
