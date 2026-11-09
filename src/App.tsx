import React, { useEffect, useState, useMemo } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { Heartbeat, Incident, Monitor, NotificationChannel, SystemStats } from './types';
import { api } from './services/api';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { MonitorCard } from './components/MonitorCard';
import { MonitorModal } from './components/MonitorModal';
import { MonitorDetailModal } from './components/MonitorDetailModal';
import { IncidentsView } from './components/IncidentsView';
import { NotificationChannelsView } from './components/NotificationChannelsView';
import { PublicStatusPage } from './components/PublicStatusPage';

export function App() {
  const [activeTab, setActiveTab] = useState<'monitors' | 'incidents' | 'alerts' | 'status-page'>('monitors');
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [heartbeatsMap, setHeartbeatsMap] = useState<Record<string, Heartbeat[]>>({});
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [notifications, setNotifications] = useState<NotificationChannel[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UP' | 'DOWN' | 'PAUSED'>('ALL');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState<Monitor | null>(null);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

  const fetchData = async () => {
    try {
      const [statsData, monitorsData, incidentsData, notifsData] = await Promise.all([
        api.getStats(),
        api.getMonitors(),
        api.getIncidents(),
        api.getNotifications(),
      ]);

      setStats(statsData);
      setMonitors(monitorsData);
      setIncidents(incidentsData);
      setNotifications(notifsData);

      const hbPromises = monitorsData.map(async (m) => {
        try {
          const hbs = await api.getHeartbeats(m.id, 40);
          return { id: m.id, hbs };
        } catch {
          return { id: m.id, hbs: [] };
        }
      });

      const hbResults = await Promise.all(hbPromises);
      const newMap: Record<string, Heartbeat[]> = {};
      for (const res of hbResults) {
        newMap[res.id] = res.hbs;
      }
      setHeartbeatsMap(newMap);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveMonitor = async (data: Partial<Monitor>) => {
    if (editingMonitor) {
      const updated = await api.updateMonitor(editingMonitor.id, data);
      setMonitors(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    } else {
      const created = await api.createMonitor(data);
      setMonitors(prev => [...prev, created]);
    }
    await fetchData();
  };

  const handleDeleteMonitor = async (id: string) => {
    await api.deleteMonitor(id);
    setMonitors(prev => prev.filter(m => m.id !== id));
    if (selectedMonitor?.id === id) {
      setSelectedMonitor(null);
    }
    await fetchData();
  };

  const handleCheckNow = async (id: string) => {
    const updated = await api.checkMonitorNow(id);
    setMonitors(prev => prev.map(m => (m.id === updated.id ? updated : m)));
    const hbs = await api.getHeartbeats(id, 40);
    setHeartbeatsMap(prev => ({ ...prev, [id]: hbs }));
  };

  const handleTogglePause = async (id: string) => {
    const updated = await api.togglePause(id);
    setMonitors(prev => prev.map(m => (m.id === updated.id ? updated : m)));
  };

  const handleAddIncidentUpdate = async (incidentId: string, status: Incident['status'], message: string) => {
    await api.addIncidentUpdate(incidentId, status, message);
    await fetchData();
  };

  const handleCreateIncident = async (title: string, cause: string, initialMessage: string) => {
    await api.createIncident({ title, cause, initialMessage, status: 'INVESTIGATING' });
    await fetchData();
  };

  const handleCreateNotification = async (data: Partial<NotificationChannel>) => {
    const created = await api.createNotification(data);
    setNotifications(prev => [...prev, created]);
  };

  const handleUpdateNotification = async (id: string, data: Partial<NotificationChannel>) => {
    const updated = await api.updateNotification(id, data);
    setNotifications(prev => prev.map(n => (n.id === updated.id ? updated : n)));
  };

  const handleDeleteNotification = async (id: string) => {
    await api.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleTestNotification = async (id: string) => {
    return api.testNotification(id);
  };

  const groups = useMemo(() => {
    const set = new Set<string>();
    monitors.forEach(m => {
      if (m.group) set.add(m.group);
    });
    return Array.from(set);
  }, [monitors]);

  const filteredMonitors = useMemo(() => {
    return monitors.filter(m => {
      const matchSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.url.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (statusFilter === 'UP' && m.status !== 'UP') return false;
      if (statusFilter === 'DOWN' && m.status !== 'DOWN') return false;
      if (statusFilter === 'PAUSED' && !m.paused) return false;

      if (selectedGroup !== 'ALL' && m.group !== selectedGroup) return false;

      return true;
    });
  }, [monitors, searchQuery, statusFilter, selectedGroup]);

  if (activeTab === 'status-page') {
    return <PublicStatusPage onBackToDashboard={() => setActiveTab('monitors')} />;
  }

  const activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length;

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between">
      <div>
        <Navbar
          activeTab={activeTab as any}
          setActiveTab={setActiveTab as any}
          onOpenNewMonitor={() => {
            setEditingMonitor(null);
            setIsNewModalOpen(true);
          }}
          onOpenPublicStatus={() => setActiveTab('status-page')}
          activeIncidentsCount={activeIncidentsCount}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <StatsCards stats={stats} loading={loading} />

          {activeTab === 'monitors' && (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search monitors by name or URL..."
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs font-semibold">
                    {(['ALL', 'UP', 'DOWN', 'PAUSED'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg transition-all ${
                          statusFilter === st
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st === 'ALL' ? 'All' : st === 'UP' ? 'Up' : st === 'DOWN' ? 'Down' : 'Paused'}
                      </button>
                    ))}
                  </div>

                  {groups.length > 0 && (
                    <select
                      value={selectedGroup}
                      onChange={e => setSelectedGroup(e.target.value)}
                      className="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="ALL">All Categories</option>
                      {groups.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {filteredMonitors.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    <Filter className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">No monitors found</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    {searchQuery
                      ? 'No monitors match your current search query or active filters.'
                      : 'You do not have any monitors configured yet. Add your first monitor now.'}
                  </p>
                  <button
                    onClick={() => {
                      setEditingMonitor(null);
                      setIsNewModalOpen(true);
                    }}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Monitor</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredMonitors.map(m => (
                    <MonitorCard
                      key={m.id}
                      monitor={m}
                      heartbeats={heartbeatsMap[m.id] || []}
                      onCheckNow={handleCheckNow}
                      onTogglePause={handleTogglePause}
                      onEdit={mon => {
                        setEditingMonitor(mon);
                        setIsNewModalOpen(true);
                      }}
                      onDelete={handleDeleteMonitor}
                      onSelect={mon => setSelectedMonitor(mon)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'incidents' && (
            <IncidentsView
              incidents={incidents}
              onAddUpdate={handleAddIncidentUpdate}
              onCreateIncident={handleCreateIncident}
            />
          )}

          {activeTab === 'alerts' && (
            <NotificationChannelsView
              channels={notifications}
              onCreateChannel={handleCreateNotification}
              onUpdateChannel={handleUpdateNotification}
              onDeleteChannel={handleDeleteNotification}
              onTestChannel={handleTestNotification}
            />
          )}
        </main>
      </div>

      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
        PulseGuard | Real-time Uptime Engine & Automated Incident Management
      </footer>

      <MonitorModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSave={handleSaveMonitor}
        editingMonitor={editingMonitor}
        notifications={notifications}
      />

      <MonitorDetailModal
        monitor={selectedMonitor}
        heartbeats={selectedMonitor ? (heartbeatsMap[selectedMonitor.id] || []) : []}
        onClose={() => setSelectedMonitor(null)}
        onCheckNow={handleCheckNow}
      />
    </div>
  );
}

export default App;
