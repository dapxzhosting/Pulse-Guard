import { Heartbeat, Incident, Monitor, NotificationChannel, PublicStatusConfig, SystemStats } from '../types';

const API_BASE = '/api';

export const api = {
  async getStats(): Promise<SystemStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  async getMonitors(): Promise<Monitor[]> {
    const res = await fetch(`${API_BASE}/monitors`);
    if (!res.ok) throw new Error('Failed to fetch monitors');
    const data = await res.json();
    return data.monitors;
  },

  async getMonitor(id: string): Promise<Monitor> {
    const res = await fetch(`${API_BASE}/monitors/${id}`);
    if (!res.ok) throw new Error('Failed to fetch monitor');
    const data = await res.json();
    return data.monitor;
  },

  async createMonitor(monitor: Partial<Monitor>): Promise<Monitor> {
    const res = await fetch(`${API_BASE}/monitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(monitor),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create monitor');
    }
    const data = await res.json();
    return data.monitor;
  },

  async updateMonitor(id: string, updates: Partial<Monitor>): Promise<Monitor> {
    const res = await fetch(`${API_BASE}/monitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update monitor');
    const data = await res.json();
    return data.monitor;
  },

  async deleteMonitor(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/monitors/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete monitor');
  },

  async checkMonitorNow(id: string): Promise<Monitor> {
    const res = await fetch(`${API_BASE}/monitors/${id}/check-now`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to trigger check');
    const data = await res.json();
    return data.monitor;
  },

  async togglePause(id: string): Promise<Monitor> {
    const res = await fetch(`${API_BASE}/monitors/${id}/toggle-pause`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to toggle pause');
    const data = await res.json();
    return data.monitor;
  },

  async getHeartbeats(monitorId: string, limit: number = 100): Promise<Heartbeat[]> {
    const res = await fetch(`${API_BASE}/heartbeats/${monitorId}?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to fetch heartbeats');
    const data = await res.json();
    return data.heartbeats;
  },

  async getIncidents(): Promise<Incident[]> {
    const res = await fetch(`${API_BASE}/incidents`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    const data = await res.json();
    return data.incidents;
  },

  async createIncident(incident: Partial<Incident> & { initialMessage?: string }): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(incident),
    });
    if (!res.ok) throw new Error('Failed to create incident');
    const data = await res.json();
    return data.incident;
  },

  async addIncidentUpdate(id: string, status: Incident['status'], message: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, message }),
    });
    if (!res.ok) throw new Error('Failed to add incident update');
    const data = await res.json();
    return data.incident;
  },

  async getNotifications(): Promise<NotificationChannel[]> {
    const res = await fetch(`${API_BASE}/notifications`);
    if (!res.ok) throw new Error('Failed to fetch notifications');
    const data = await res.json();
    return data.notifications;
  },

  async createNotification(notif: Partial<NotificationChannel>): Promise<NotificationChannel> {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notif),
    });
    if (!res.ok) throw new Error('Failed to create notification channel');
    const data = await res.json();
    return data.notification;
  },

  async updateNotification(id: string, updates: Partial<NotificationChannel>): Promise<NotificationChannel> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update notification channel');
    const data = await res.json();
    return data.notification;
  },

  async deleteNotification(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete notification');
  },

  async testNotification(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const res = await fetch(`${API_BASE}/notifications/${id}/test`, { method: 'POST' });
    return res.json();
  },

  async getPublicStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/status-page/public`);
    if (!res.ok) throw new Error('Failed to fetch public status');
    return res.json();
  },

  async getStatusConfig(): Promise<PublicStatusConfig> {
    const res = await fetch(`${API_BASE}/status-page/config`);
    if (!res.ok) throw new Error('Failed to fetch status config');
    const data = await res.json();
    return data.config;
  },

  async updateStatusConfig(config: Partial<PublicStatusConfig>): Promise<PublicStatusConfig> {
    const res = await fetch(`${API_BASE}/status-page/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update status config');
    const data = await res.json();
    return data.config;
  },
};
