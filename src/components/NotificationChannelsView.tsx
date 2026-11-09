import React, { useState } from 'react';
import { Bell, Send, Trash2, Plus, Check, AlertCircle, Edit3, ArrowDown, ArrowUp, ShieldAlert, X } from 'lucide-react';
import { NotificationChannel } from '../types';

interface NotificationChannelsViewProps {
  channels: NotificationChannel[];
  onCreateChannel: (data: Partial<NotificationChannel>) => Promise<void>;
  onUpdateChannel: (id: string, data: Partial<NotificationChannel>) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
  onTestChannel: (id: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

export const NotificationChannelsView: React.FC<NotificationChannelsViewProps> = ({
  channels,
  onCreateChannel,
  onUpdateChannel,
  onDeleteChannel,
  onTestChannel,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<NotificationChannel | null>(null);

  const [name, setName] = useState('');
  const [type, setType] = useState<NotificationChannel['type']>('discord');
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [emailRecipient, setEmailRecipient] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');

  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditingChannel(null);
    setName('');
    setType('discord');
    setDiscordWebhookUrl('');
    setTelegramBotToken('');
    setTelegramChatId('');
    setEmailRecipient('');
    setWebhookUrl('');
    setShowModal(true);
  };

  const openEdit = (ch: NotificationChannel) => {
    setEditingChannel(ch);
    setName(ch.name);
    setType(ch.type);
    setDiscordWebhookUrl(ch.config.discordWebhookUrl || '');
    setTelegramBotToken(ch.config.telegramBotToken || '');
    setTelegramChatId(ch.config.telegramChatId || '');
    setEmailRecipient(ch.config.emailRecipient || '');
    setWebhookUrl(ch.config.webhookUrl || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      const config: NotificationChannel['config'] = {};
      if (type === 'discord') config.discordWebhookUrl = discordWebhookUrl.trim();
      if (type === 'telegram') {
        config.telegramBotToken = telegramBotToken.trim();
        config.telegramChatId = telegramChatId.trim();
      }
      if (type === 'email') config.emailRecipient = emailRecipient.trim();
      if (type === 'webhook') config.webhookUrl = webhookUrl.trim();

      if (editingChannel) {
        await onUpdateChannel(editingChannel.id, { name, type, config });
      } else {
        await onCreateChannel({
          name,
          type,
          enabled: true,
          events: ['down', 'up', 'ssl_warning'],
          config,
        });
      }
      setShowModal(false);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (id: string) => {
    try {
      setTestingId(id);
      setTestResult(null);
      const res = await onTestChannel(id);
      setTestResult({
        id,
        success: res.success,
        text: res.success ? 'Test alert sent successfully' : (res.error || 'Test failed'),
      });
      setTimeout(() => setTestResult(null), 5000);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Alert Channels & Integrations</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Receive instant alerts when servers go down, recover, or when SSL certificates are about to expire.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Channel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {channels.map(ch => {
          const isTesting = testingId === ch.id;
          const isResultForThis = testResult?.id === ch.id;

          return (
            <div
              key={ch.id}
              className={`glass-panel rounded-2xl p-5 flex flex-col justify-between transition-all ${
                ch.enabled ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800/80 text-slate-300">
                      <Bell className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{ch.name}</h4>
                      <span className="text-[10px] uppercase font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {ch.type}
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ch.enabled}
                      onChange={e => onUpdateChannel(ch.id, { enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div className="mt-3 text-xs text-slate-400 space-y-1 font-mono">
                  {ch.type === 'discord' && (
                    <div className="truncate">Webhook: {ch.config.discordWebhookUrl || 'Not configured'}</div>
                  )}
                  {ch.type === 'telegram' && (
                    <div>Chat ID: {ch.config.telegramChatId || 'Not configured'}</div>
                  )}
                  {ch.type === 'email' && (
                    <div>To: {ch.config.emailRecipient || 'Not configured'}</div>
                  )}
                  {ch.type === 'webhook' && (
                    <div className="truncate">URL: {ch.config.webhookUrl || 'Not configured'}</div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                  {ch.events.map(ev => (
                    <span
                      key={ev}
                      className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                        ev === 'down'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : ev === 'up'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      }`}
                    >
                      {ev === 'down' ? (
                        <>
                          <ArrowDown className="w-3 h-3" /> Down
                        </>
                      ) : ev === 'up' ? (
                        <>
                          <ArrowUp className="w-3 h-3" /> Recovery
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3 h-3" /> SSL Alert
                        </>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  {isResultForThis && (
                    <span
                      className={`text-[11px] font-semibold flex items-center gap-1 ${
                        testResult.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {testResult.success ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      <span>{testResult.text}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleTest(ch.id)}
                    disabled={isTesting || !ch.enabled}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1 disabled:opacity-40"
                  >
                    <Send className={`w-3 h-3 ${isTesting ? 'animate-bounce' : ''}`} />
                    <span>{isTesting ? 'Sending' : 'Test Alert'}</span>
                  </button>
                  <button
                    onClick={() => openEdit(ch)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteChannel(ch.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setShowModal(false)}>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingChannel ? 'Edit Notification Channel' : 'Add Notification Channel'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Channel Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. SRE Alerts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Provider Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-semibold"
                >
                  <option value="discord">Discord Webhook</option>
                  <option value="telegram">Telegram Bot</option>
                  <option value="email">Email Notification</option>
                  <option value="webhook">Generic Webhook (JSON POST)</option>
                </select>
              </div>

              {type === 'discord' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Discord Webhook URL *</label>
                  <input
                    type="url"
                    required
                    value={discordWebhookUrl}
                    onChange={e => setDiscordWebhookUrl(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Copy from Discord Server Settings and Integrations.
                  </span>
                </div>
              )}

              {type === 'telegram' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Bot Token *</label>
                    <input
                      type="text"
                      required
                      value={telegramBotToken}
                      onChange={e => setTelegramBotToken(e.target.value)}
                      placeholder="123456:ABC1234ghIklzyx57W2v1u123ew11"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Created via BotFather on Telegram.</span>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Chat ID *</label>
                    <input
                      type="text"
                      required
                      value={telegramChatId}
                      onChange={e => setTelegramChatId(e.target.value)}
                      placeholder="100123456789 or 987654321"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </>
              )}

              {type === 'email' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email Address *</label>
                  <input
                    type="email"
                    required
                    value={emailRecipient}
                    onChange={e => setEmailRecipient(e.target.value)}
                    placeholder="alerts@yourcompany.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              )}

              {type === 'webhook' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Webhook URL *</label>
                  <input
                    type="url"
                    required
                    value={webhookUrl}
                    onChange={e => setWebhookUrl(e.target.value)}
                    placeholder="https://hooks.slack.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20"
                >
                  {saving ? 'Saving...' : editingChannel ? 'Update Channel' : 'Save Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
