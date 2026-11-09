import React, { useState, useEffect } from 'react';
import { X, Globe, Shield, Bell, Sliders } from 'lucide-react';
import { Monitor, NotificationChannel } from '../types';

interface MonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Monitor>) => Promise<void>;
  editingMonitor?: Monitor | null;
  notifications: NotificationChannel[];
}

export const MonitorModal: React.FC<MonitorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMonitor,
  notifications,
}) => {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<'GET' | 'POST' | 'HEAD' | 'PUT'>('GET');
  const [interval, setInterval] = useState(60);
  const [timeout, setTimeout] = useState(10);
  const [expectedStatus, setExpectedStatus] = useState(200);
  const [keyword, setKeyword] = useState('');
  const [group, setGroup] = useState('Websites');
  const [sslCheckEnabled, setSslCheckEnabled] = useState(true);
  const [sslAlertDaysThreshold, setSslAlertDaysThreshold] = useState(30);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [headersText, setHeadersText] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingMonitor) {
      setName(editingMonitor.name);
      setUrl(editingMonitor.url);
      setMethod(editingMonitor.method as any);
      setInterval(editingMonitor.interval);
      setTimeout(editingMonitor.timeout);
      setExpectedStatus(editingMonitor.expectedStatus);
      setKeyword(editingMonitor.keyword || '');
      setGroup(editingMonitor.group || 'Websites');
      setSslCheckEnabled(editingMonitor.sslCheckEnabled);
      setSslAlertDaysThreshold(editingMonitor.sslAlertDaysThreshold || 30);
      setSelectedChannels(editingMonitor.notificationChannels || []);
      setHeadersText(editingMonitor.headers ? JSON.stringify(editingMonitor.headers, null, 2) : '');
      setBodyText(editingMonitor.body || '');
      if (editingMonitor.headers || editingMonitor.body || editingMonitor.keyword) {
        setShowAdvanced(true);
      }
    } else {
      setName('');
      setUrl('https://');
      setMethod('GET');
      setInterval(60);
      setTimeout(10);
      setExpectedStatus(200);
      setKeyword('');
      setGroup('Websites');
      setSslCheckEnabled(true);
      setSslAlertDaysThreshold(30);
      setSelectedChannels(notifications.map(n => n.id));
      setHeadersText('');
      setBodyText('');
      setShowAdvanced(false);
    }
    setError('');
  }, [editingMonitor, isOpen, notifications]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a name for this monitor');
      return;
    }

    try {
      new URL(url);
    } catch {
      setError('Please provide a valid URL (e.g. https://example.com)');
      return;
    }

    let parsedHeaders: Record<string, string> = {};
    if (headersText.trim()) {
      try {
        parsedHeaders = JSON.parse(headersText);
      } catch {
        setError('Headers must be valid JSON format');
        return;
      }
    }

    try {
      setLoading(true);
      await onSave({
        name: name.trim(),
        url: url.trim(),
        method,
        interval: Number(interval),
        timeout: Number(timeout),
        expectedStatus: Number(expectedStatus),
        keyword: keyword.trim(),
        group: group.trim() || 'General',
        sslCheckEnabled,
        sslAlertDaysThreshold: Number(sslAlertDaysThreshold),
        notificationChannels: selectedChannels,
        headers: parsedHeaders,
        body: bodyText,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save monitor');
    } finally {
      setLoading(false);
    }
  };

  const toggleChannel = (id: string) => {
    setSelectedChannels(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingMonitor ? 'Edit Monitor' : 'Create New Monitor'}
              </h2>
              <p className="text-xs text-slate-400">
                Configure HTTP ping interval, SSL alerting, and notifications.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-xs font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Friendly Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Production API"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category Group
              </label>
              <input
                type="text"
                value={group}
                onChange={e => setGroup(e.target.value)}
                placeholder="Websites, Core APIs, Database"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target URL *
            </label>
            <div className="flex gap-2">
              <select
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-emerald-400 font-mono font-semibold focus:outline-none focus:border-emerald-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
              </select>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://api.yourdomain.com/health"
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Heartbeat Interval
              </label>
              <select
                value={interval}
                onChange={e => setInterval(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={10}>Every 10 seconds</option>
                <option value={30}>Every 30 seconds</option>
                <option value={60}>Every 1 minute</option>
                <option value={120}>Every 2 minutes</option>
                <option value={300}>Every 5 minutes</option>
                <option value={600}>Every 10 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Timeout (seconds)
              </label>
              <input
                type="number"
                min={2}
                max={60}
                value={timeout}
                onChange={e => setTimeout(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected HTTP Status
              </label>
              <input
                type="number"
                value={expectedStatus}
                onChange={e => setExpectedStatus(Number(e.target.value))}
                placeholder="200"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">
                  SSL Certificate Expiry Checker
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={sslCheckEnabled}
                  onChange={e => setSslCheckEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {sslCheckEnabled && (
              <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                <span>Alert when expiration is within:</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={3}
                    max={90}
                    value={sslAlertDaysThreshold}
                    onChange={e => setSslAlertDaysThreshold(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-white"
                  />
                  <span>days</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Notification Channels</span>
            </label>
            {notifications.length === 0 ? (
              <div className="text-xs text-slate-500 italic bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                No notification channels configured yet. You can set them up in the Alerts tab.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {notifications.map(channel => (
                  <label
                    key={channel.id}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all ${
                      selectedChannels.includes(channel.id)
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedChannels.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                      className="rounded border-slate-700 text-emerald-500 focus:ring-0"
                    />
                    <div className="text-xs truncate">
                      <div className="font-medium truncate text-white">{channel.name}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{channel.type}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showAdvanced ? 'Hide Advanced Options' : 'Show Advanced (Payload, Headers, Keyword Assertions)'}</span>
            </button>
          </div>

          {showAdvanced && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Response Body Keyword Assertion
                </label>
                <input
                  type="text"
                  value={keyword}
                  onChange={e => setKeyword(e.target.value)}
                  placeholder="e.g. status: ok or Welcome"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Fails check if response does not contain this exact string.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Custom Request Headers (JSON)
                </label>
                <textarea
                  rows={2}
                  value={headersText}
                  onChange={e => setHeadersText(e.target.value)}
                  placeholder='{"Authorization": "Bearer token123", "X-Custom": "val"}'
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {['POST', 'PUT', 'PATCH'].includes(method) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Request Body Payload
                  </label>
                  <textarea
                    rows={2}
                    value={bodyText}
                    onChange={e => setBodyText(e.target.value)}
                    placeholder='{"query": "healthcheck"}'
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors font-medium flex items-center gap-1.5 disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              {loading ? 'Saving...' : editingMonitor ? 'Update Monitor' : 'Create Monitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
