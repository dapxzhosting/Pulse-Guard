const API_BASE = '/api';
let ipInfoUpdateTimer = null;

const state = {
  activeTab: window.location.hash === '#/status' ? 'status-page' : 'monitors',
  stats: null,
  monitors: [],
  heartbeatsMap: {},
  incidents: [],
  notifications: [],
  searchQuery: '',
  statusFilter: 'ALL',
  selectedGroup: 'ALL',
  selectedMonitor: null,
  editingMonitor: null,
  isNewModalOpen: false,
  activeIncidentId: null,
  showNewIncidentModal: false,
  showNotifModal: false,
  editingNotif: null,
  testResult: null,
  testingNotifId: null,
  checkingMonitorId: null,
  publicData: null
};

const api = {
  async getStats() {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },
  async getMonitors() {
    const res = await fetch(`${API_BASE}/monitors`);
    const data = await res.json();
    return data.monitors || [];
  },
  async getMonitor(id) {
    const res = await fetch(`${API_BASE}/monitors/${id}`);
    const data = await res.json();
    return data.monitor;
  },
  async createMonitor(body) {
    const res = await fetch(`${API_BASE}/monitors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async updateMonitor(id, body) {
    const res = await fetch(`${API_BASE}/monitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async deleteMonitor(id) {
    const res = await fetch(`${API_BASE}/monitors/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async togglePause(id) {
    const res = await fetch(`${API_BASE}/monitors/${id}/pause`, { method: 'POST' });
    return res.json();
  },
  async checkNow(id) {
    const res = await fetch(`${API_BASE}/monitors/${id}/check`, { method: 'POST' });
    return res.json();
  },
  async getHeartbeats(id, limit = 35) {
    const res = await fetch(`${API_BASE}/heartbeats/${id}?limit=${limit}`);
    const data = await res.json();
    return data.heartbeats || [];
  },
  async getIncidents() {
    const res = await fetch(`${API_BASE}/incidents`);
    const data = await res.json();
    return data.incidents || [];
  },
  async createIncident(body) {
    const res = await fetch(`${API_BASE}/incidents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async addIncidentUpdate(id, status, message) {
    const res = await fetch(`${API_BASE}/incidents/${id}/updates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, message }),
    });
    return res.json();
  },
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`);
    const data = await res.json();
    return data.notifications || data.channels || [];
  },
  async createNotification(body) {
    const res = await fetch(`${API_BASE}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async updateNotification(id, body) {
    const res = await fetch(`${API_BASE}/notifications/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return res.json();
  },
  async deleteNotification(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE' });
    return res.json();
  },
  async testNotification(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/test`, { method: 'POST' });
    return res.json();
  },
  async getPublicStatus() {
    const res = await fetch(`${API_BASE}/status-page/public`);
    return res.json();
  },
};

const Icons = {
  zap: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  activity: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  checkCircle: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-width="2" stroke-linecap="round"/><polyline points="22 4 12 14.01 9 11.01" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  xCircle: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke-width="2"/></svg>`,
  clock: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><polyline points="12 6 12 12 16 14" stroke-width="2"/></svg>`,
  shield: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-width="2"/></svg>`,
  shieldAlert: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg>`,
  bell: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" stroke-width="2"/><path d="M13.73 21a2 2 0 0 1-3.46 0" stroke-width="2"/></svg>`,
  alertTriangle: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke-width="2"/></svg>`,
  refresh: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" stroke-width="2"/><polyline points="1 20 1 14 7 14" stroke-width="2"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke-width="2"/></svg>`,
  play: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
  pause: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`,
  edit: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2"/></svg>`,
  trash: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" stroke-width="2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2"/></svg>`,
  externalLink: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke-width="2"/><polyline points="15 3 21 3 21 9" stroke-width="2"/><line x1="10" y1="14" x2="21" y2="3" stroke-width="2"/></svg>`,
  globe: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="2" y1="12" x2="22" y2="12" stroke-width="2"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke-width="2"/></svg>`,
  plus: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" stroke-width="2.5"/><line x1="5" y1="12" x2="19" y2="12" stroke-width="2.5"/></svg>`,
  send: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" stroke-width="2"/><polygon points="22 2 15 22 11 13 2 9 22 2" stroke-width="2"/></svg>`,
  arrowLeft: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="19" y1="12" x2="5" y2="12" stroke-width="2"/><polyline points="12 19 5 12 12 5" stroke-width="2"/></svg>`,
  close: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke-linecap="round"/></svg>`,
  check: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrowDown: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" stroke-width="2" stroke-linecap="round"/><polyline points="19 12 12 19 5 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  arrowUp: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="12" y1="19" x2="12" y2="5" stroke-width="2" stroke-linecap="round"/><polyline points="5 12 12 5 19 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  search: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" stroke-width="2"/><line x1="21" y1="21" x2="16.65" y2="16.65" stroke-width="2" stroke-linecap="round"/></svg>`,
  download: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke-width="2"/><polyline points="7 10 12 15 17 10" stroke-width="2"/><line x1="12" y1="15" x2="12" y2="3" stroke-width="2"/></svg>`,
  terminal: `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5" stroke-width="2"/><line x1="12" y1="19" x2="20" y2="19" stroke-width="2"/></svg>`,
  volume: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke-width="2"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke-width="2"/></svg>`,
  volumeMute: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke-width="2"/><line x1="23" y1="9" x2="17" y2="15" stroke-width="2"/><line x1="17" y1="9" x2="23" y2="15" stroke-width="2"/></svg>`,
};

const SoundFX = {
  ctx: null,
  enabled: typeof localStorage !== 'undefined' ? localStorage.getItem('pulseguard_sound') !== 'muted' : true,
  init() {
    if (!this.ctx && typeof AudioContext !== 'undefined') {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  toggle() {
    this.enabled = !this.enabled;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pulseguard_sound', this.enabled ? 'enabled' : 'muted');
    }
    const btn = document.getElementById('soundToggleBtn');
    if (btn) {
      btn.innerHTML = this.enabled ? Icons.volume : Icons.volumeMute;
      btn.title = this.enabled ? 'Sound effects enabled' : 'Sound effects muted';
    }
    if (this.enabled) this.play('success');
    return this.enabled;
  },
  play(type = 'click') {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      const now = this.ctx.currentTime;
      if (type === 'click') {
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.exponentialRampToValueAtTime(760, now + 0.12);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {}
  }
};

window.toggleSound = () => SoundFX.toggle();

function animateWithGsap() {
  if (typeof gsap === 'undefined') return;
  try {
    gsap.fromTo('.monitor-card',
      { opacity: 0, y: 14, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.42, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
    gsap.fromTo('.stats-card',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.38, stagger: 0.04, ease: 'power2.out', clearProps: 'transform,opacity' }
    );
  } catch {}
}

function animateModalOpen() {
  if (typeof gsap === 'undefined') return;
  try {
    const box = document.querySelector('#modal-root [onclick="event.stopPropagation()"]');
    if (box) {
      gsap.fromTo(box,
        { opacity: 0, scale: 0.92, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: 'back.out(1.4)', clearProps: 'transform,opacity' }
      );
    }
  } catch {}
}

function initSpotlightCards() {
  document.querySelectorAll('.spotlight-card').forEach((card) => {
    card.onmousemove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };
  });
}

function isFormModalOpen() {
  return state.isNewModalOpen || state.showNewIncidentModal || state.activeIncidentId !== null || state.showNotifModal;
}

async function fetchAllData() {
  try {
    const [stats, monitors, incidents, notifications] = await Promise.all([
      api.getStats(),
      api.getMonitors(),
      api.getIncidents(),
      api.getNotifications(),
    ]);

    state.stats = stats;
    state.monitors = monitors;
    state.incidents = incidents;
    state.notifications = notifications;

    const hbPromises = monitors.map(async (m) => {
      try {
        const hbs = await api.getHeartbeats(m.id, 35);
        return { id: m.id, hbs };
      } catch {
        return { id: m.id, hbs: [] };
      }
    });

    const hbResults = await Promise.all(hbPromises);
    hbResults.forEach((res) => {
      state.heartbeatsMap[res.id] = res.hbs;
    });

    if (state.selectedMonitor) {
      const updated = monitors.find((m) => m.id === state.selectedMonitor.id);
      if (updated) {
        state.selectedMonitor = updated;
        updateSelectedMonitorModal();
      }
    }

    if (state.activeTab === 'status-page') {
      state.publicData = await api.getPublicStatus();
      renderPublicPageOnly();
      return;
    }

    renderDashboardBackground();
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function render() {
  const app = document.getElementById('app');
  if (!app) return;

  if (state.activeTab === 'status-page') {
    app.innerHTML = renderPublicStatusPage();
    renderModals();
    return;
  }

  const activeIncidentsCount = (state.incidents || []).filter((i) => i.status !== 'RESOLVED').length;

  app.innerHTML = `
    <div class="min-h-screen flex flex-col justify-between">
      <div>
        ${renderNavbar(activeIncidentsCount)}
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div id="statsCardsContainer">
            ${renderStatsCards()}
          </div>
          <div id="tabContentContainer">
            ${state.activeTab === 'monitors' ? renderMonitorsTab() : ''}
            ${state.activeTab === 'incidents' ? renderIncidentsTab() : ''}
            ${state.activeTab === 'alerts' ? renderAlertsTab() : ''}
          </div>
        </main>
      </div>
      ${renderFooter()}
    </div>
  `;

  attachEvents();
  renderModals();
  initSpotlightCards();
  animateWithGsap();
}

function renderDashboardBackground() {
  const activeInput = document.activeElement;
  const isTypingInSearch = activeInput && activeInput.id === 'searchBox';

  const statsContainer = document.getElementById('statsCardsContainer');
  if (statsContainer) {
    statsContainer.innerHTML = renderStatsCards();
  }

  if (state.activeTab === 'monitors') {
    const listContainer = document.getElementById('monitorsListContainer');
    if (listContainer) {
      listContainer.innerHTML = renderMonitorsCardsList();
    } else if (!isTypingInSearch) {
      const tabContainer = document.getElementById('tabContentContainer');
      if (tabContainer) tabContainer.innerHTML = renderMonitorsTab();
      attachEvents();
    }
  } else if (state.activeTab === 'incidents') {
    const tabContainer = document.getElementById('tabContentContainer');
    if (tabContainer) tabContainer.innerHTML = renderIncidentsTab();
  } else if (state.activeTab === 'alerts') {
    const tabContainer = document.getElementById('tabContentContainer');
    if (tabContainer) tabContainer.innerHTML = renderAlertsTab();
  }
  initSpotlightCards();
}

function renderPublicPageOnly() {
  const app = document.getElementById('app');
  if (app && state.activeTab === 'status-page') {
    app.innerHTML = renderPublicStatusPage();
  }
}

function renderNavbar(activeIncidentsCount) {
  return `
    <header class="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-3 cursor-pointer" onclick="window.switchTab('monitors')">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/20">
              ${Icons.zap}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-base font-extrabold tracking-tight text-white">PulseGuard</span>
                <div class="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span class="relative flex h-2 w-2">
                    <span class="radar-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="radar-ping-delay absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span class="text-[9px] font-mono font-bold tracking-wider">ONLINE</span>
                </div>
              </div>
              <p class="text-[10px] text-slate-400 font-medium">Uptime & Health Monitor</p>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-1.5">
            <button onclick="window.switchTab('monitors')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${state.activeTab === 'monitors' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              ${Icons.activity} <span>Monitors</span>
            </button>
            <button onclick="window.switchTab('incidents')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all relative ${state.activeTab === 'incidents' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              ${Icons.alertTriangle} <span>Incidents</span>
              ${activeIncidentsCount > 0 ? `<span class="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">${activeIncidentsCount}</span>` : ''}
            </button>
            <button onclick="window.switchTab('alerts')" class="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${state.activeTab === 'alerts' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              ${Icons.bell} <span>Alerts & Webhooks</span>
            </button>
          </nav>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <button onclick="window.toggleSound()" id="soundToggleBtn" title="${SoundFX.enabled ? 'Sound effects enabled (Click to mute)' : 'Sound effects muted (Click to unmute)'}" class="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            ${SoundFX.enabled ? Icons.volume : Icons.volumeMute}
          </button>
          <button onclick="window.switchTab('status-page')" class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-colors">
            <span>Public Status Page</span>
            ${Icons.externalLink}
          </button>
          <button onclick="window.openCreateMonitor()" class="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
            ${Icons.plus} <span>New Monitor</span>
          </button>
        </div>
      </div>
    </header>
  `;
}

function renderStatsCards() {
  const stats = state.stats || {
    totalMonitors: 0,
    upMonitors: 0,
    downMonitors: 0,
    overallUptime: 100,
    avgLatency: 0,
    activeIncidents: 0,
  };

  return `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="glass-panel stats-card spotlight-card rounded-2xl p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
          <span>Monitors</span>
          <span class="text-slate-400">${Icons.activity}</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-white font-mono">${stats.totalMonitors}</span>
          <span class="text-xs text-slate-400">active checks</span>
        </div>
      </div>

      <div class="glass-panel stats-card spotlight-card border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span>Operational</span>
          <span>${Icons.checkCircle}</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-emerald-400 font-mono">${stats.upMonitors}</span>
          <span class="text-xs text-emerald-500/80">healthy</span>
        </div>
      </div>

      <div class="glass-panel stats-card spotlight-card ${stats.downMonitors > 0 ? 'border-rose-500/40 bg-rose-950/10' : 'border-slate-800'} rounded-2xl p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between ${stats.downMonitors > 0 ? 'text-rose-400' : 'text-slate-400'} text-xs font-semibold uppercase tracking-wider">
          <span>Outages</span>
          <span>${Icons.xCircle}</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold ${stats.downMonitors > 0 ? 'text-rose-400' : 'text-slate-200'} font-mono">${stats.downMonitors}</span>
          <span class="text-xs ${stats.downMonitors > 0 ? 'text-rose-400' : 'text-slate-500'}">${stats.activeIncidents > 0 ? `${stats.activeIncidents} active incident` : 'all operational'}</span>
        </div>
      </div>

      <div class="glass-panel stats-card spotlight-card rounded-2xl p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <span>24h Uptime</span>
          <span>${Icons.zap}</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-white font-mono">${stats.overallUptime}%</span>
          <span class="text-xs text-emerald-400 font-medium">Target 99.9%</span>
        </div>
      </div>

      <div class="glass-panel stats-card spotlight-card rounded-2xl p-4 flex flex-col justify-between">
        <div class="flex items-center justify-between text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <span>Avg Latency</span>
          <span>${Icons.clock}</span>
        </div>
        <div class="mt-3 flex items-baseline gap-2">
          <span class="text-2xl font-bold text-white font-mono">${stats.avgLatency}ms</span>
          <span class="text-xs text-slate-400">global response</span>
        </div>
      </div>
    </div>
  `;
}

function getFilteredMonitors() {
  return state.monitors.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
      m.url.toLowerCase().includes(state.searchQuery.toLowerCase());
    if (!matchSearch) return false;

    if (state.statusFilter === 'UP' && m.status !== 'UP') return false;
    if (state.statusFilter === 'DOWN' && m.status !== 'DOWN') return false;
    if (state.statusFilter === 'PAUSED' && !m.paused) return false;

    if (state.selectedGroup !== 'ALL' && (m.group || 'General') !== state.selectedGroup) return false;
    return true;
  });
}

function renderMonitorsTab() {
  const groups = Array.from(new Set(state.monitors.map((m) => m.group || 'General')));
  const totalCount = state.monitors.length;
  const upCount = state.monitors.filter((m) => m.status === 'UP').length;
  const downCount = state.monitors.filter((m) => m.status === 'DOWN').length;
  const pausedCount = state.monitors.filter((m) => m.paused).length;

  return `
    <div class="space-y-5">
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            ${Icons.search}
          </div>
          <input
            type="text"
            id="searchBox"
            value="${escapeHtml(state.searchQuery)}"
            placeholder="Search monitors by name or target URL..."
            class="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <div class="bg-slate-900/90 border border-slate-800 rounded-xl p-1 flex items-center gap-1 text-xs font-semibold">
            <button onclick="window.setStatusFilter('ALL')" class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${state.statusFilter === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              <span>All</span> <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 border border-slate-700/80">${totalCount}</span>
            </button>
            <button onclick="window.setStatusFilter('UP')" class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${state.statusFilter === 'UP' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span> <span>Up</span> <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${upCount}</span>
            </button>
            <button onclick="window.setStatusFilter('DOWN')" class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${state.statusFilter === 'DOWN' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              <span class="w-2 h-2 rounded-full bg-rose-400"></span> <span>Down</span> <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">${downCount}</span>
            </button>
            <button onclick="window.setStatusFilter('PAUSED')" class="px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${state.statusFilter === 'PAUSED' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}">
              <span>Paused</span> <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800/80 border border-slate-700/80">${pausedCount}</span>
            </button>
          </div>

          <button onclick="window.exportSlaCsv()" title="Export all monitors SLA as CSV" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm">
            ${Icons.download} <span>Export SLA</span>
          </button>

          ${
            groups.length > 0
              ? `
            <select id="groupSelect" class="bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500">
              <option value="ALL" ${state.selectedGroup === 'ALL' ? 'selected' : ''}>All Categories</option>
              ${groups.map((g) => `<option value="${escapeHtml(g)}" ${state.selectedGroup === g ? 'selected' : ''}>${escapeHtml(g)}</option>`).join('')}
            </select>
          `
              : ''
          }
        </div>
      </div>

      <div id="monitorsListContainer">
        ${renderMonitorsCardsList()}
      </div>
    </div>
  `;
}

function renderMonitorsCardsList() {
  const filtered = getFilteredMonitors();

  if (filtered.length === 0) {
    return `
      <div class="glass-panel rounded-2xl p-12 text-center">
        <div class="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-slate-400 mx-auto flex items-center justify-center mb-3">
          ${Icons.activity}
        </div>
        <h3 class="text-base font-bold text-white">No monitors found</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try adjusting your search query, status filter, or create your first monitor.</p>
        <button onclick="window.openCreateMonitor()" class="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
          ${Icons.plus} <span>Create Monitor</span>
        </button>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 gap-4">
      ${filtered.map((m) => renderMonitorCard(m)).join('')}
    </div>
  `;
}

function renderMonitorCard(monitor) {
  const isUp = monitor.status === 'UP';
  const isDown = monitor.status === 'DOWN';
  const isPaused = monitor.paused;
  const isChecking = state.checkingMonitorId === monitor.id;
  const isMaintenance = monitor.maintenanceUntil && new Date(monitor.maintenanceUntil).getTime() > Date.now();
  const heartbeats = state.heartbeatsMap[monitor.id] || [];

  return `
    <div onclick="window.openMonitorDetail('${monitor.id}')" class="glass-panel monitor-card spotlight-card rounded-2xl p-5 transition-all duration-200 cursor-pointer hover:border-slate-700 shadow-sm group">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-start gap-3.5 min-w-0">
          <div class="relative mt-1 flex-shrink-0">
            ${
              isPaused
                ? `<span class="w-3.5 h-3.5 rounded-full bg-slate-500 block"></span>`
                : isUp
                ? `
              <span class="w-3.5 h-3.5 rounded-full bg-emerald-500 block"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-emerald-400 absolute inset-0 animate-ping opacity-60"></span>
            `
                : isDown
                ? `
              <span class="w-3.5 h-3.5 rounded-full bg-rose-500 block"></span>
              <span class="w-3.5 h-3.5 rounded-full bg-rose-400 absolute inset-0 animate-ping opacity-75"></span>
            `
                : `<span class="w-3.5 h-3.5 rounded-full bg-amber-400 block"></span>`
            }
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="text-base font-semibold text-white group-hover:text-emerald-400 transition-colors truncate">
                ${escapeHtml(monitor.name)}
              </h3>
              <span class="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold border border-slate-700">
                ${monitor.method || 'GET'}
              </span>
              ${
                monitor.group
                  ? `
                <span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
                  ${escapeHtml(monitor.group)}
                </span>
              `
                  : ''
              }
              ${
                isMaintenance
                  ? `
                <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold flex items-center gap-1">
                  ${Icons.clock} Muted
                </span>
              `
                  : ''
              }
            </div>

            <div class="flex items-center gap-2 mt-1.5 text-xs text-slate-400 truncate">
              <a href="${escapeHtml(monitor.url)}" target="_blank" rel="noreferrer" onclick="event.stopPropagation()" class="hover:text-slate-200 flex items-center gap-1 font-mono truncate max-w-sm">
                ${Icons.globe}
                <span class="truncate">${escapeHtml(monitor.url)}</span>
                ${Icons.externalLink}
              </a>
              <span class="text-slate-600">|</span>
              <span class="font-mono text-slate-400">${monitor.interval || 60}s check interval</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 flex-wrap lg:flex-nowrap">
          ${renderSslBadge(monitor.sslInfo, monitor.sslCheckEnabled)}

          <div class="text-right min-w-[70px]">
            <div class="text-[11px] text-slate-400 font-medium">Avg Latency</div>
            <div class="text-sm font-semibold text-white font-mono">
              ${monitor.avgLatency24h ? `${monitor.avgLatency24h}ms` : '0 ms'}
            </div>
          </div>

          <div class="text-right min-w-[80px]">
            <div class="text-[11px] text-slate-400 font-medium">30d Uptime</div>
            <div class="text-sm font-bold font-mono ${(monitor.uptime30d || 100) >= 99.5 ? 'text-emerald-400' : 'text-amber-400'}">
              ${monitor.uptime30d ? `${monitor.uptime30d.toFixed(2)}%` : '100%'}
            </div>
          </div>

          <div class="flex items-center gap-1 border-l border-slate-800 pl-3" onclick="event.stopPropagation()">
            <button onclick="window.checkNow('${monitor.id}')" title="Check now" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              <span class="${isChecking ? 'animate-spin block text-emerald-400' : ''}">${Icons.refresh}</span>
            </button>
            <button onclick="window.togglePause('${monitor.id}')" title="${isPaused ? 'Resume' : 'Pause'}" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              ${isPaused ? `<span class="text-emerald-400">${Icons.play}</span>` : `<span class="text-amber-400">${Icons.pause}</span>`}
            </button>
            <button onclick="window.openEditMonitor('${monitor.id}')" title="Edit" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
              ${Icons.edit}
            </button>
            <button onclick="window.deleteMonitor('${monitor.id}')" title="Delete" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors">
              ${Icons.trash}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-t border-slate-800/60">
        ${renderUptimeBar(monitor.id, heartbeats, monitor.uptime30d || 100)}
      </div>
    </div>
  `;
}

function renderUptimeBar(monitorId, heartbeats, uptimePercentage) {
  const count = 35;
  const items = Array.from({ length: count }, (_, i) => {
    const dataIndex = heartbeats.length - count + i;
    if (dataIndex >= 0 && dataIndex < heartbeats.length) {
      return heartbeats[dataIndex];
    }
    return {
      status: 'UP',
      latency: Math.round(25 + (i % 6) * 5),
      timestamp: new Date(Date.now() - (count - i) * 60 * 60 * 1000).toISOString(),
    };
  });

  return `
    <div class="w-full">
      <div class="flex items-center gap-[3px] h-7 w-full py-1">
        ${items
          .map((item) => {
            const isUp = item.status === 'UP';
            const colorClass = isUp ? 'bg-emerald-500/80 hover:bg-emerald-400' : 'bg-rose-500 hover:bg-rose-400';
            const ts = new Date(item.timestamp).toLocaleString();
            const latencyText = item.latency ? `${item.latency}ms` : '';
            const tooltip = `${isUp ? 'Operational' : 'Downtime'} ${latencyText} | ${ts}`;

            return `
            <div
              title="${tooltip}"
              class="flex-1 h-full rounded-[2px] transition-all duration-150 ${colorClass} hover:scale-y-125 cursor-pointer"
            ></div>
          `;
          })
          .join('')}
      </div>

      <div class="flex items-center justify-between text-[11px] text-slate-400 font-medium px-0.5 mt-1">
        <span>30 days ago</span>
        <span class="text-emerald-400 font-semibold font-mono">${Number(uptimePercentage).toFixed(2)}% uptime</span>
        <span>Today</span>
      </div>
    </div>
  `;
}

function renderSslBadge(sslInfo, enabled) {
  if (!enabled) {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400">${Icons.shield} SSL Disabled</span>`;
  }
  if (!sslInfo) {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-400 animate-pulse">${Icons.shield} Checking SSL</span>`;
  }

  const days = sslInfo.daysRemaining ?? 0;
  if (days <= 0 || !sslInfo.valid) {
    return `<span title="${sslInfo.error || 'Expired certificate'}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">${Icons.shieldAlert} SSL Expired</span>`;
  }
  if (days <= 30) {
    return `<span title="Expires in ${days} days (${new Date(sslInfo.validTo).toLocaleDateString()})" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">${Icons.shieldAlert} SSL ${days}d left</span>`;
  }
  return `<span title="Issuer: ${sslInfo.issuer || 'Trusted CA'}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">${Icons.shield} SSL ${days}d</span>`;
}

function renderSvgLatencyChart(heartbeats) {
  if (!heartbeats || heartbeats.length < 2) {
    return `<div class="h-44 flex items-center justify-center text-xs text-slate-500 bg-slate-950/50 rounded-xl border border-slate-800">Collecting more latency data points</div>`;
  }

  const latencies = heartbeats.map((h) => h.latency || 25);
  const min = Math.min(...latencies);
  const max = Math.max(...latencies, 20);
  const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);

  const width = 700;
  const height = 180;
  const padding = { top: 20, right: 16, bottom: 25, left: 45 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const range = max - min || 10;

  const getX = (idx) => padding.left + (idx / (heartbeats.length - 1)) * innerWidth;
  const getY = (val) => padding.top + innerHeight - ((val - min) / (range * 1.15 || 1)) * innerHeight;

  let pathD = '';
  heartbeats.forEach((hb, idx) => {
    const x = getX(idx);
    const y = getY(hb.latency || min);
    pathD += idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
  });

  const areaD = `${pathD} L ${getX(heartbeats.length - 1)} ${padding.top + innerHeight} L ${getX(0)} ${padding.top + innerHeight} Z`;

  return `
    <div class="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
      <div class="flex items-center justify-between mb-3 text-xs">
        <span class="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Response Time Trend (ms)
        </span>
        <div class="flex items-center gap-4 font-mono text-xs">
          <span class="text-slate-400">Min: <strong class="text-emerald-400">${min}ms</strong></span>
          <span class="text-slate-400">Avg: <strong class="text-sky-400">${avg}ms</strong></span>
          <span class="text-slate-400">Max: <strong class="text-amber-400">${max}ms</strong></span>
        </div>
      </div>

      <svg viewBox="0 0 ${width} ${height}" class="w-full h-auto">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <line x1="${padding.left}" y1="${padding.top}" x2="${width - padding.right}" y2="${padding.top}" stroke="#1e293b" stroke-dasharray="3 3"/>
        <line x1="${padding.left}" y1="${padding.top + innerHeight / 2}" x2="${width - padding.right}" y2="${padding.top + innerHeight / 2}" stroke="#1e293b" stroke-dasharray="3 3"/>
        <line x1="${padding.left}" y1="${padding.top + innerHeight}" x2="${width - padding.right}" y2="${padding.top + innerHeight}" stroke="#334155"/>

        <text x="${padding.left - 8}" y="${padding.top + 4}" text-anchor="end" fill="#64748b" font-size="10" font-family="monospace">${Math.round(min + range * 1.15)}ms</text>
        <text x="${padding.left - 8}" y="${padding.top + innerHeight / 2 + 3}" text-anchor="end" fill="#64748b" font-size="10" font-family="monospace">${Math.round(min + range * 0.5)}ms</text>
        <text x="${padding.left - 8}" y="${padding.top + innerHeight}" text-anchor="end" fill="#64748b" font-size="10" font-family="monospace">${min}ms</text>

        <path d="${areaD}" fill="url(#grad)"/>
        <path d="${pathD}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round"/>

        ${heartbeats
          .map(
            (hb, idx) => `
          <circle cx="${getX(idx)}" cy="${getY(hb.latency || min)}" r="3" fill="#10b981" stroke="#0f172a" stroke-width="1.5">
            <title>${hb.latency}ms | ${new Date(hb.timestamp).toLocaleTimeString()}</title>
          </circle>
        `
          )
          .join('')}
      </svg>
    </div>
  `;
}

function renderIncidentsTab() {
  const active = state.incidents.filter((i) => i.status !== 'RESOLVED');
  const past = state.incidents.filter((i) => i.status === 'RESOLVED');

  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white">Incidents & Outages</h2>
          <p class="text-xs text-slate-400 mt-0.5">Track automated downtime alerts and manage customer-facing incident logs.</p>
        </div>
        <button onclick="window.openNewIncidentModal()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
          ${Icons.plus} <span>Post Manual Incident</span>
        </button>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          ${Icons.alertTriangle} <span>Active Incidents (${active.length})</span>
        </h3>

        ${
          active.length === 0
            ? `
          <div class="glass-panel rounded-2xl p-8 text-center">
            <div class="text-emerald-400 mx-auto mb-2 flex justify-center">${Icons.checkCircle}</div>
            <h4 class="text-base font-semibold text-white">No active incidents</h4>
            <p class="text-xs text-slate-400 mt-1">All monitored systems are functioning smoothly without disruptions.</p>
          </div>
        `
            : `
          <div class="space-y-4">
            ${active
              .map(
                (inc) => `
              <div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg">
                <div class="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">${inc.status}</span>
                      <h4 class="text-base font-bold text-white">${escapeHtml(inc.title)}</h4>
                    </div>
                    <div class="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Service: <strong class="text-slate-200">${escapeHtml(inc.monitorName)}</strong></span>
                      <span>|</span>
                      <span>Started: ${new Date(inc.startedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <button onclick="window.openAddIncidentUpdate('${inc.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5">
                    <span>Add Progress Note</span>
                  </button>
                </div>

                <div class="mt-4 border-l-2 border-slate-800 ml-2 space-y-3 pl-4">
                  ${(inc.updates || [])
                    .map(
                      (up) => `
                    <div class="relative">
                      <div class="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-600 border-2 border-slate-900"></div>
                      <div class="flex items-center gap-2 text-xs">
                        <span class="font-bold text-sky-400">${up.status}</span>
                        <span class="text-[11px] text-slate-400 font-mono">${new Date(up.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p class="text-xs text-slate-300 mt-0.5">${escapeHtml(up.message)}</p>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
        }
      </div>

      ${
        past.length > 0
          ? `
        <div class="space-y-3 pt-4">
          <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            ${Icons.clock} <span>Past Resolved Incidents (${past.length})</span>
          </h3>
          <div class="space-y-2.5">
            ${past
              .map(
                (inc) => `
              <div class="glass-panel rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div>
                  <span class="font-semibold text-slate-200">${escapeHtml(inc.title)}</span>
                  <span class="text-slate-500 ml-2">(${escapeHtml(inc.monitorName)})</span>
                </div>
                <span class="text-slate-400 font-mono">${new Date(inc.startedAt).toLocaleDateString()}</span>
              </div>
            `
              )
              .join('')}
          </div>
        </div>
      `
          : ''
      }
    </div>
  `;
}

function renderAlertsTab() {
  return `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-xl font-bold text-white">Alerts & Notifications</h2>
          <p class="text-xs text-slate-400 mt-0.5">Configure alerting webhooks for Discord, Telegram, Email, and generic HTTP endpoints.</p>
        </div>
        <button onclick="window.openNewNotifModal()" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center gap-1.5 shadow-md shadow-emerald-500/20">
          ${Icons.plus} <span>Add Channel</span>
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${(state.notifications || [])
          .map((ch) => {
            const isTesting = state.testingNotifId === ch.id;
            const result = state.testResult && state.testResult.id === ch.id ? state.testResult : null;

            return `
            <div class="glass-panel rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      ch.type === 'discord'
                        ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                        : ch.type === 'telegram'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : ch.type === 'email'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }">${ch.type}</span>
                    <h4 class="text-sm font-bold text-white">${escapeHtml(ch.name)}</h4>
                  </div>
                  <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" ${ch.enabled ? 'checked' : ''} onchange="window.toggleChannel('${ch.id}', this.checked)" class="sr-only peer"/>
                    <div class="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div class="mt-3 text-xs text-slate-400 font-mono space-y-1">
                  ${ch.type === 'discord' ? `<div class="truncate">Webhook: ${escapeHtml(ch.config.discordWebhookUrl || 'Not set')}</div>` : ''}
                  ${ch.type === 'telegram' ? `<div>Chat ID: ${escapeHtml(ch.config.telegramChatId || 'Not set')}</div>` : ''}
                  ${ch.type === 'email' ? `<div>Recipient: ${escapeHtml(ch.config.emailRecipient || 'Not set')}</div>` : ''}
                  ${ch.type === 'webhook' ? `<div class="truncate">Endpoint: ${escapeHtml(ch.config.webhookUrl || 'Not set')}</div>` : ''}
                </div>

                <div class="mt-3 flex items-center gap-1.5 flex-wrap">
                  ${(ch.events || [])
                    .map((ev) => `
                    <span class="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                      ev === 'down'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : ev === 'up'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    }">
                      ${ev === 'down' ? `${Icons.arrowDown} Down` : ev === 'up' ? `${Icons.arrowUp} Recovery` : `${Icons.shieldAlert} SSL Alert`}
                    </span>
                  `)
                    .join('')}
                </div>
              </div>

              <div class="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  ${
                    result
                      ? `
                    <span class="inline-flex items-center gap-1 text-[11px] font-semibold ${result.success ? 'text-emerald-400' : 'text-rose-400'}">
                      ${result.success ? `${Icons.check} Test alert sent` : `${Icons.xCircle} ${result.error || 'Failed'}`}
                    </span>
                  `
                      : ''
                  }
                </div>
                <div class="flex items-center gap-2">
                  <button onclick="window.testChannel('${ch.id}')" ${isTesting ? 'disabled' : ''} class="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5">
                    ${Icons.send} <span>${isTesting ? 'Sending' : 'Test Alert'}</span>
                  </button>
                  <button onclick="window.openEditNotif('${ch.id}')" class="p-1 rounded-lg text-slate-400 hover:text-white">${Icons.edit}</button>
                  <button onclick="window.deleteChannel('${ch.id}')" class="p-1 rounded-lg text-slate-400 hover:text-rose-400">${Icons.trash}</button>
                </div>
              </div>
            </div>
          `;
          })
          .join('')}
      </div>
    </div>
  `;
}

function renderPublicStatusPage() {
  const data = state.publicData || {};
  const config = data.config || { title: 'System Status', description: 'Real-time operational health' };
  const overallStatus = data.overallStatus || 'OPERATIONAL';
  const groups = data.groups || {};
  const monitorBars = data.monitorBars || {};
  const activeIncidents = data.activeIncidents || [];

  return `
    <div class="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between">
      <div class="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-40">
        <div class="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
              ${Icons.zap}
            </div>
            <div>
              <h1 class="text-base font-bold text-white">${escapeHtml(config.title)}</h1>
              <p class="text-[11px] text-slate-400">Live Infrastructure Health</p>
            </div>
          </div>
          <button onclick="window.switchTab('monitors')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5">
            ${Icons.arrowLeft} <span>Dashboard</span>
          </button>
        </div>
      </div>

      <div class="max-w-4xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <div class="rounded-2xl p-6 border ${overallStatus === 'OPERATIONAL' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}">
          <div class="flex items-center justify-between flex-wrap gap-4">
            <div class="flex items-center gap-3.5">
              <div class="${overallStatus === 'OPERATIONAL' ? 'text-emerald-400' : 'text-rose-400'} scale-125">
                ${overallStatus === 'OPERATIONAL' ? Icons.checkCircle : Icons.alertTriangle}
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">
                  ${overallStatus === 'OPERATIONAL' ? 'All Systems Operational' : 'Active Outage Detected'}
                </h2>
                <p class="text-xs text-slate-300 mt-0.5">
                  ${
                    overallStatus === 'OPERATIONAL'
                      ? 'All web endpoints, APIs, and infrastructure checks are operating within normal parameters.'
                      : 'Some monitored endpoints are currently experiencing elevated latency or outages.'
                  }
                </p>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 block">30-Day Aggregate Uptime</span>
              <span class="text-2xl font-bold font-mono text-emerald-400">${data.avgUptime || 100}%</span>
            </div>
          </div>
        </div>

        ${
          activeIncidents.length > 0
            ? `
          <div class="space-y-4">
            <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              ${Icons.alertTriangle} <span>Ongoing Incidents</span>
            </h3>
            ${activeIncidents
              .map(
                (inc) => `
              <div class="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg space-y-3">
                <div class="flex items-center justify-between">
                  <h4 class="text-base font-bold text-white">${escapeHtml(inc.title)}</h4>
                  <span class="px-2 py-0.5 rounded text-xs font-bold uppercase bg-rose-500/20 text-rose-400 font-mono">${inc.status}</span>
                </div>
                <div class="border-l-2 border-slate-800 ml-2 space-y-2 pl-4">
                  ${(inc.updates || [])
                    .map(
                      (up) => `
                    <div class="text-xs">
                      <span class="text-slate-400 font-mono text-[11px]">${new Date(up.timestamp).toLocaleString()}</span>
                      <p class="text-slate-200 mt-0.5">${escapeHtml(up.message)}</p>
                    </div>
                  `
                    )
                    .join('')}
                </div>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="space-y-6">
          <h3 class="text-sm font-bold text-white uppercase tracking-wider">System Services & Uptime</h3>
          ${Object.entries(groups)
            .map(
              ([groupName, monitors]) => `
            <div class="glass-panel rounded-2xl overflow-hidden shadow-sm">
              <div class="px-5 py-3 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
                <h4 class="text-sm font-bold text-slate-200">${escapeHtml(groupName)}</h4>
                <span class="text-xs text-slate-400 font-mono">${monitors.length} services</span>
              </div>
              <div class="divide-y divide-slate-800/60">
                ${monitors
                  .map((mon) => {
                    const isUp = mon.status === 'UP';
                    const bars = monitorBars[mon.id] || [];
                    return `
                    <div class="p-5 space-y-3">
                      <div class="flex items-center justify-between gap-4">
                        <div class="flex items-center gap-3">
                          <span class="w-2.5 h-2.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
                          <span class="text-sm font-semibold text-white">${escapeHtml(mon.name)}</span>
                        </div>
                        <span class="text-xs font-bold font-mono px-2 py-0.5 rounded ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">
                          ${isUp ? 'Operational' : 'Outage'}
                        </span>
                      </div>
                      ${renderUptimeBar(mon.id, bars, mon.uptime30d || 100)}
                    </div>
                  `;
                  })
                  .join('')}
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
      ${renderFooter()}
    </div>
  `;
}

function renderFooter() {
  return `
    <footer class="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono">
      PulseGuard | Real-time Uptime Engine & Automated Incident Management
    </footer>
  `;
}

function renderIpInfo(ipInfo) {
  if (!ipInfo) {
    return `
      <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
        <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">${Icons.globe} IP &amp; Server Location</h4>
        <p class="text-xs text-slate-500 italic">Location details will appear after the first successful IP lookup.</p>
      </div>
    `;
  }

  const coordinatesAvailable =
    Number.isFinite(ipInfo.lat) &&
    Number.isFinite(ipInfo.lon) &&
    ipInfo.lat >= -90 && ipInfo.lat <= 90 &&
    ipInfo.lon >= -180 && ipInfo.lon <= 180;
  const countryCode = /^[A-Za-z]{2}$/.test(ipInfo.countryCode || '')
    ? ipInfo.countryCode.toUpperCase()
    : '';
  const countryFlag = countryCode
    ? String.fromCodePoint(...[...countryCode].map(char => 127397 + char.charCodeAt(0)))
    : '';

  let localTime = 'Unavailable';
  if (ipInfo.timezone) {
    try {
      localTime = new Intl.DateTimeFormat('en-US', {
        timeZone: ipInfo.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());
    } catch (error) {
      console.warn('Invalid timezone in IP location data:', error);
    }
  }

  const rows = [
    ['IP address', ipInfo.ip, true],
    ['Host name', ipInfo.hostname],
    ['ASN', ipInfo.asn],
    ['ISP / Org', [ipInfo.isp, ipInfo.org].filter(Boolean).join(' / ')],
    ['Country', `${countryFlag ? `${countryFlag} ` : ''}${ipInfo.country || ''}${countryCode ? ` (${countryCode})` : ''}`],
    ['Region', ipInfo.region],
    ['City', ipInfo.city],
    ['Time zone', ipInfo.timezone],
    ['Local time', localTime],
    ['Postal code', ipInfo.zip],
    ['Coordinates', coordinatesAvailable ? `${ipInfo.lat}, ${ipInfo.lon}` : 'Unavailable'],
  ].filter(([, value]) => value);

  const map = coordinatesAvailable
    ? (() => {
        const lat = Number(ipInfo.lat);
        const lon = Number(ipInfo.lon);
        const bbox = [
          Math.max(-180, lon - 1),
          Math.max(-90, lat - 0.7),
          Math.min(180, lon + 1),
          Math.min(90, lat + 0.7),
        ].join('%2C');
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
        const mapLink = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=10/${lat}/${lon}`;
        return `
          <div class="min-h-[260px] md:min-h-full relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900">
            <iframe
              title="Server location map"
              src="${mapUrl}"
              class="absolute inset-0 w-full h-full border-0"
              loading="lazy"
              referrerpolicy="no-referrer"
            ></iframe>
            <a href="${mapLink}" target="_blank" rel="noreferrer" class="absolute bottom-2 right-2 px-2 py-1 rounded bg-slate-950/90 text-[10px] text-slate-300 hover:text-white">
              OpenStreetMap
            </a>
          </div>
        `;
      })()
    : `<div class="min-h-[180px] flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-xs text-slate-500">Map coordinates unavailable</div>`;

  return `
    <section class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
      <div class="flex items-start justify-between gap-3 mb-3">
        <div>
          <div class="flex items-center gap-2">
            <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">${Icons.globe} IP &amp; Server Location</h4>
            <span class="ip-info-update-indicator" role="status"><span class="ip-info-spinner"></span>Updating location</span>
          </div>
          <p class="text-[11px] text-slate-500 mt-1">Resolved endpoint and approximate geolocation</p>
        </div>
        ${countryCode ? `<span class="text-[11px] font-mono text-slate-400">${countryCode}</span>` : ''}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div class="md:col-span-3 overflow-hidden rounded-lg border border-slate-700">
          <table class="w-full text-left text-xs">
            <tbody class="divide-y divide-slate-700/80">
              ${rows.map(([label, value, emphasize]) => `
                <tr class="odd:bg-slate-800/70 even:bg-slate-900/80">
                  <th class="w-1/3 px-2.5 py-1.5 text-slate-400 font-medium">${escapeHtml(label)}</th>
                  <td class="px-2.5 py-1.5 text-slate-200 ${emphasize ? 'font-bold font-mono' : ''} break-words">${escapeHtml(value)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="md:col-span-2">${map}</div>
      </div>
      ${ipInfo.fetchedAt ? `<p class="mt-2 text-right text-[10px] text-slate-500">Last resolved ${escapeHtml(new Date(ipInfo.fetchedAt).toLocaleString())}</p>` : ''}
    </section>
  `;
}

function renderModals() {
  const root = document.getElementById('modal-root');
  if (!root) return;

  if (state.isNewModalOpen) {
    const isEdit = Boolean(state.editingMonitor);
    const m = state.editingMonitor || {
      name: '',
      url: 'https://',
      method: 'GET',
      interval: 60,
      timeout: 10,
      expectedStatus: 200,
      keyword: '',
      group: 'Websites',
      sslCheckEnabled: true,
      sslAlertDaysThreshold: 30,
    };

    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onclick="if(event.target === this) window.closeModals()">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b border-slate-800">
            <h2 class="text-base font-bold text-white flex items-center gap-2">
              <span>${isEdit ? 'Edit Monitor' : 'Create New Monitor'}</span>
            </h2>
            <button onclick="window.closeModals()" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">${Icons.close}</button>
          </div>
          <form onsubmit="window.saveMonitor(event)" class="overflow-y-auto p-5 space-y-4 flex-1">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Friendly Name *</label>
                <input type="text" id="mName" required value="${escapeHtml(m.name)}" placeholder="e.g. Production API" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Category Group</label>
                <input type="text" id="mGroup" value="${escapeHtml(m.group || 'Websites')}" placeholder="Websites, Core APIs" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"/>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Target URL *</label>
              <div class="flex gap-2">
                <select id="mMethod" class="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-emerald-400 font-mono font-semibold">
                  ${['GET', 'POST', 'HEAD', 'PUT'].map((met) => `<option value="${met}" ${m.method === met ? 'selected' : ''}>${met}</option>`).join('')}
                </select>
                <input type="url" id="mUrl" required value="${escapeHtml(m.url)}" placeholder="https://api.yourdomain.com/health" class="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Interval</label>
                <select id="mInterval" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono">
                  ${[10, 30, 60, 120, 300].map((sec) => `<option value="${sec}" ${m.interval === sec ? 'selected' : ''}>${sec}s</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Timeout (s)</label>
                <input type="number" id="mTimeout" value="${m.timeout || 10}" min="2" max="60" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Expected HTTP</label>
                <input type="number" id="mExpectedStatus" value="${m.expectedStatus || 200}" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Response Body Keyword Assertion (Optional)</label>
              <input type="text" id="mKeyword" value="${escapeHtml(m.keyword || '')}" placeholder="e.g. status: ok" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
            </div>

            <details class="border border-slate-800 rounded-xl bg-slate-950/60 p-3 group">
              <summary class="text-xs font-semibold text-slate-300 cursor-pointer flex items-center justify-between select-none">
                <span class="flex items-center gap-1.5">${Icons.terminal} Advanced HTTP Options (Headers &amp; Payload)</span>
                <span class="text-slate-500 text-[10px] group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div class="mt-3 space-y-3 pt-3 border-t border-slate-800/80">
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Custom Headers (JSON Object)</label>
                  <textarea id="mHeaders" rows="2" placeholder='{"Authorization": "Bearer secret-token", "X-Api-Key": "123"}' class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono">${escapeHtml(m.headers ? JSON.stringify(m.headers, null, 2) : '')}</textarea>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-400 mb-1">Request Body Payload (for POST, PUT, PATCH)</label>
                  <textarea id="mBody" rows="2" placeholder='{"query": "healthcheck"}' class="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono">${escapeHtml(m.body || '')}</textarea>
                </div>
              </div>
            </details>

            <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">${Icons.shield} SSL Certificate Expiry Monitoring</span>
                <input type="checkbox" id="mSslCheck" ${m.sslCheckEnabled ? 'checked' : ''} class="rounded text-emerald-500"/>
              </div>
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span>Alert when expiry is within:</span>
                <div class="flex items-center gap-1">
                  <input type="number" id="mSslDays" value="${m.sslAlertDaysThreshold || 30}" class="w-14 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-center font-mono text-white"/>
                  <span>days</span>
                </div>
              </div>
            </div>

            <div class="pt-4 border-t border-slate-800 flex justify-end gap-3">
              <button type="button" onclick="window.closeModals()" class="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" class="px-5 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md shadow-emerald-500/20">${isEdit ? 'Update Monitor' : 'Create Monitor'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
    animateModalOpen();
    return;
  }

  if (state.selectedMonitor) {
    const mon = state.selectedMonitor;
    const isUp = mon.status === 'UP';
    const heartbeats = state.heartbeatsMap[mon.id] || [];
    const latestHb = heartbeats[heartbeats.length - 1];
    const ssl = mon.sslInfo;

    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onclick="if(event.target === this) window.closeModals()">
        <div id="monitorDetailModalBox" class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
            <div class="flex items-center gap-3">
              <span class="w-3.5 h-3.5 rounded-full ${isUp ? 'bg-emerald-400' : 'bg-rose-500'}"></span>
              <div>
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                  <span>${escapeHtml(mon.name)}</span>
                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">${mon.method || 'GET'}</span>
                </h2>
                <div class="text-xs text-slate-400 font-mono mt-0.5">${escapeHtml(mon.url)}</div>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <select onchange="window.setMaintenanceMode('${mon.id}', this.value)" title="Snooze alerts during maintenance" class="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none transition-colors">
                <option value="none" ${!mon.maintenanceUntil || new Date(mon.maintenanceUntil).getTime() <= Date.now() ? 'selected' : ''}>Alerts: Active</option>
                <option value="1h" ${mon.maintenanceUntil && new Date(mon.maintenanceUntil).getTime() > Date.now() ? 'selected' : ''}>Snooze 1h</option>
                <option value="4h">Snooze 4h</option>
                <option value="24h">Snooze 24h</option>
              </select>
              <button onclick="window.copyCurl('${mon.id}')" id="copyCurlBtn" title="Copy cURL terminal command" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors">
                ${Icons.terminal} <span>Copy cURL</span>
              </button>
              <button onclick="window.exportSlaCsv('${mon.id}')" title="Export monitor SLA as CSV" class="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors">
                ${Icons.download} <span>SLA CSV</span>
              </button>
              <button onclick="window.checkNow('${mon.id}')" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 flex items-center gap-1.5">
                ${Icons.refresh} <span>Check Now</span>
              </button>
              <button onclick="window.closeModals()" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">${Icons.close}</button>
            </div>
          </div>

          <div id="monitorDetailContentArea" class="p-5 overflow-y-auto space-y-6 flex-1">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">24h Uptime</span>
                <div class="text-xl font-bold font-mono text-emerald-400 mt-1">${mon.uptime24h ? `${mon.uptime24h.toFixed(2)}%` : '100%'}</div>
              </div>
              <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">30d Uptime</span>
                <div class="text-xl font-bold font-mono text-emerald-400 mt-1">${mon.uptime30d ? `${mon.uptime30d.toFixed(2)}%` : '100%'}</div>
              </div>
              <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">Avg Latency</span>
                <div class="text-xl font-bold font-mono text-white mt-1">${mon.avgLatency24h ? `${mon.avgLatency24h}ms` : '0 ms'}</div>
              </div>
              <div class="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl">
                <span class="text-[11px] font-semibold text-slate-400 uppercase">Interval</span>
                <div class="text-xl font-bold font-mono text-sky-400 mt-1">${mon.interval || 60}s</div>
              </div>
            </div>

            <div id="modalIpInfoContainer" data-ip-info-key="${escapeHtml(JSON.stringify(mon.ipInfo || null))}">
              ${renderIpInfo(mon.ipInfo)}
            </div>

            <div id="modalSvgChartContainer">
              ${renderSvgLatencyChart(heartbeats)}
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  ${Icons.zap} Network Latency Breakdown
                </h4>
                ${
                  latestHb?.latencyBreakdown
                    ? `
                  <div class="space-y-2 text-xs font-mono">
                    <div class="flex justify-between text-slate-300"><span>DNS Lookup:</span><span>${latestHb.latencyBreakdown.dns || 0}ms</span></div>
                    <div class="flex justify-between text-slate-300"><span>TCP Handshake:</span><span>${latestHb.latencyBreakdown.tcp || 0}ms</span></div>
                    <div class="flex justify-between text-slate-300"><span>TLS / SSL:</span><span>${latestHb.latencyBreakdown.tls || 0}ms</span></div>
                    <div class="flex justify-between text-slate-300"><span>TTFB:</span><span>${latestHb.latencyBreakdown.ttfb || 0}ms</span></div>
                    <div class="pt-2 border-t border-slate-800 flex justify-between font-bold text-white"><span>Total:</span><span class="text-emerald-400">${latestHb.latency}ms</span></div>
                  </div>
                `
                    : `<div class="text-xs text-slate-500 italic">No breakdown captured yet.</div>`
                }
              </div>

              <div class="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <h4 class="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  ${Icons.shield} SSL Certificate Details
                </h4>
                ${
                  mon.sslCheckEnabled && ssl
                    ? `
                  <div class="space-y-2 text-xs">
                    <div class="flex justify-between"><span class="text-slate-400">Issuer CA:</span><span class="text-white truncate max-w-[200px]">${escapeHtml(ssl.issuer || 'Unknown')}</span></div>
                    <div class="flex justify-between"><span class="text-slate-400">Subject:</span><span class="text-white font-mono truncate max-w-[200px]">${escapeHtml(ssl.subject || 'Domain cert')}</span></div>
                    <div class="flex justify-between"><span class="text-slate-400">Expires:</span><span class="text-slate-300 font-mono">${ssl.validTo ? new Date(ssl.validTo).toLocaleDateString() : 'None'} (${ssl.daysRemaining}d left)</span></div>
                    ${ssl.error ? `<div class="text-rose-400 mt-2 font-medium">${escapeHtml(ssl.error)}</div>` : ''}
                  </div>
                `
                    : `<div class="text-xs text-slate-500 italic">SSL check is not active for this endpoint.</div>`
                }
              </div>
            </div>

            <div class="space-y-2">
              <h4 class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                ${Icons.clock} Recent Heartbeats Log
              </h4>
              <div class="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/60">
                <table class="w-full text-left text-xs font-mono">
                  <thead class="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr><th class="p-2.5">Status</th><th class="p-2.5">Code</th><th class="p-2.5">Latency</th><th class="p-2.5">Message</th><th class="p-2.5 text-right">Time</th></tr>
                  </thead>
                  <tbody class="divide-y divide-slate-800/60">
                    ${heartbeats
                      .slice(-10)
                      .reverse()
                      .map(
                        (hb) => `
                      <tr>
                        <td class="p-2.5"><span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${hb.status === 'UP' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}">${hb.status}</span></td>
                        <td class="p-2.5 text-slate-300">${hb.statusCode || 'N/A'}</td>
                        <td class="p-2.5 text-white font-bold">${hb.latency} ms</td>
                        <td class="p-2.5 text-slate-400 max-w-xs font-sans">
                          <div class="truncate">${escapeHtml(hb.message || 'OK')}</div>
                          ${hb.responseSnippet ? `<details class="mt-1"><summary class="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer select-none">View Response</summary><pre class="mt-1 p-2 bg-slate-900 border border-slate-800 rounded text-[10px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-24">${escapeHtml(hb.responseSnippet)}</pre></details>` : ''}
                        </td>
                        <td class="p-2.5 text-right text-slate-500 text-[11px] whitespace-nowrap">${new Date(hb.timestamp).toLocaleTimeString()}</td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    animateModalOpen();
    return;
  }

  if (state.showNewIncidentModal) {
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onclick="if(event.target === this) window.closeModals()">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 class="text-base font-bold text-white">Declare Manual Incident</h3>
            <button onclick="window.closeModals()" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">${Icons.close}</button>
          </div>
          <form onsubmit="window.saveNewIncident(event)" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Title *</label>
              <input type="text" id="incTitle" required placeholder="e.g. Elevated latency on Payment Gateway" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Root Cause</label>
              <input type="text" id="incCause" placeholder="e.g. Upstream database connection limits" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Initial Investigation Update</label>
              <textarea id="incMsg" rows="3" placeholder="Engineers are investigating service degradation..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onclick="window.closeModals()" class="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" class="px-4 py-1.5 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-lg shadow-md shadow-rose-500/20">Declare Incident</button>
            </div>
          </form>
        </div>
      </div>
    `;
    animateModalOpen();
    return;
  }

  if (state.activeIncidentId) {
    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onclick="if(event.target === this) window.closeModals()">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 class="text-base font-bold text-white">Post Status Update</h3>
            <button onclick="window.closeModals()" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">${Icons.close}</button>
          </div>
          <form onsubmit="window.saveIncidentUpdate(event)" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Incident Status</label>
              <select id="upStatus" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white">
                <option value="INVESTIGATING">Investigating</option>
                <option value="IDENTIFIED">Identified</option>
                <option value="MONITORING">Monitoring</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Progress Message *</label>
              <textarea id="upMessage" rows="3" required placeholder="Describe current status or resolution steps applied..." class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"></textarea>
            </div>
            <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onclick="window.closeModals()" class="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" class="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md shadow-emerald-500/20">Post Update</button>
            </div>
          </form>
        </div>
      </div>
    `;
    animateModalOpen();
    return;
  }

  if (state.showNotifModal) {
    const isEdit = Boolean(state.editingNotif);
    const n = state.editingNotif || { name: '', type: 'discord', config: {} };

    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onclick="if(event.target === this) window.closeModals()">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl overflow-y-auto max-h-[90vh]" onclick="event.stopPropagation()">
          <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <h3 class="text-base font-bold text-white">${isEdit ? 'Edit Notification Channel' : 'Add Notification Channel'}</h3>
            <button onclick="window.closeModals()" class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">${Icons.close}</button>
          </div>
          <form onsubmit="window.saveNotification(event)" class="space-y-3.5">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Channel Name *</label>
              <input type="text" id="nName" required value="${escapeHtml(n.name)}" placeholder="e.g. SRE Alerts" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"/>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Provider Type</label>
              <select id="nType" onchange="window.toggleNotifFields(this.value)" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-semibold">
                <option value="discord" ${n.type === 'discord' ? 'selected' : ''}>Discord Webhook</option>
                <option value="telegram" ${n.type === 'telegram' ? 'selected' : ''}>Telegram Bot</option>
                <option value="email" ${n.type === 'email' ? 'selected' : ''}>Email Alert</option>
                <option value="webhook" ${n.type === 'webhook' ? 'selected' : ''}>Generic Webhook (POST)</option>
              </select>
            </div>

            <div id="discordField" class="${n.type === 'discord' ? '' : 'hidden'}">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Discord Webhook URL</label>
              <input type="url" id="nDiscordUrl" value="${escapeHtml(n.config.discordWebhookUrl || '')}" placeholder="https://discord.com/api/webhooks/..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
            </div>

            <div id="telegramFields" class="${n.type === 'telegram' ? '' : 'hidden'} space-y-2">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Bot Token</label>
                <input type="text" id="nTgToken" value="${escapeHtml(n.config.telegramBotToken || '')}" placeholder="123456:ABC..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Chat ID</label>
                <input type="text" id="nTgChat" value="${escapeHtml(n.config.telegramChatId || '')}" placeholder="10012345678" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
              </div>
            </div>

            <div id="emailField" class="${n.type === 'email' ? '' : 'hidden'}">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Recipient Email *</label>
              <input type="email" id="nEmail" value="${escapeHtml(n.config.emailRecipient || '')}" placeholder="alerts@domain.com" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
              <p class="mt-1.5 text-[11px] text-slate-500">Alert akan dikirim oleh server ke email ini saat monitor down atau recover.</p>
            </div>

            <div id="webhookField" class="${n.type === 'webhook' ? '' : 'hidden'}">
              <label class="block text-xs font-semibold text-slate-300 mb-1">Target Webhook URL</label>
              <input type="url" id="nWebhookUrl" value="${escapeHtml(n.config.webhookUrl || '')}" placeholder="https://hooks.slack.com/..." class="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"/>
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onclick="window.closeModals()" class="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white">Cancel</button>
              <button type="submit" class="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg shadow-md shadow-emerald-500/20">${isEdit ? 'Update Channel' : 'Save Channel'}</button>
            </div>
          </form>
        </div>
      </div>
    `;
    animateModalOpen();
    return;
  }

  root.innerHTML = '';
}

function updateSelectedMonitorModal() {
  if (!state.selectedMonitor) return;
  const container = document.getElementById('modalSvgChartContainer');
  const mon = state.selectedMonitor;
  const heartbeats = state.heartbeatsMap[mon.id] || [];
  const ipInfoContainer = document.getElementById('modalIpInfoContainer');
  if (ipInfoContainer) {
    const ipInfoKey = JSON.stringify(mon.ipInfo || null);
    if (ipInfoContainer.dataset.ipInfoKey !== ipInfoKey) {
      ipInfoContainer.innerHTML = renderIpInfo(mon.ipInfo);
      ipInfoContainer.dataset.ipInfoKey = ipInfoKey;
      ipInfoContainer.setAttribute('aria-busy', 'true');
      ipInfoContainer.classList.add('ip-info-updating');
      if (ipInfoUpdateTimer) clearTimeout(ipInfoUpdateTimer);
      ipInfoUpdateTimer = setTimeout(() => {
        ipInfoContainer.classList.remove('ip-info-updating');
        ipInfoContainer.removeAttribute('aria-busy');
        ipInfoUpdateTimer = null;
      }, 1100);
    }
  }
  if (container) {
    container.innerHTML = renderSvgLatencyChart(heartbeats);
  }
}

window.switchTab = (tab) => {
  state.activeTab = tab;
  window.location.hash = tab === 'status-page' ? '#/status' : '';
  fetchAllData();
  render();
};

window.setStatusFilter = (st) => {
  state.statusFilter = st;
  const listContainer = document.getElementById('monitorsListContainer');
  if (listContainer) {
    listContainer.innerHTML = renderMonitorsCardsList();
  }
  const tabContainer = document.getElementById('tabContentContainer');
  if (tabContainer && !listContainer) {
    tabContainer.innerHTML = renderMonitorsTab();
    attachEvents();
  }
};

window.openCreateMonitor = () => {
  state.editingMonitor = null;
  state.isNewModalOpen = true;
  renderModals();
};

window.openEditMonitor = (id) => {
  const mon = state.monitors.find((m) => m.id === id);
  if (mon) {
    state.editingMonitor = mon;
    state.isNewModalOpen = true;
    renderModals();
  }
};

window.openMonitorDetail = (id) => {
  const mon = state.monitors.find((m) => m.id === id);
  if (mon) {
    state.selectedMonitor = mon;
    renderModals();
  }
};

window.closeModals = () => {
  state.isNewModalOpen = false;
  state.editingMonitor = null;
  state.selectedMonitor = null;
  state.showNewIncidentModal = false;
  state.activeIncidentId = null;
  state.showNotifModal = false;
  state.editingNotif = null;
  renderModals();
};

window.copyCurl = (monitorId) => {
  SoundFX.play('click');
  const mon = state.monitors.find((m) => m.id === monitorId) || state.selectedMonitor;
  if (!mon) return;
  const curlCmd = `curl -i -X ${mon.method || 'GET'} "${mon.url}" -H "User-Agent: PulseGuard-UptimeBot/1.0"`;
  navigator.clipboard.writeText(curlCmd).then(() => {
    SoundFX.play('success');
    const btn = document.getElementById('copyCurlBtn');
    if (btn) {
      btn.innerHTML = `${Icons.check} <span class="text-emerald-400 font-bold">Copied!</span>`;
      setTimeout(() => {
        if (btn) btn.innerHTML = `${Icons.terminal} <span>Copy cURL</span>`;
      }, 2000);
    }
  });
};

window.exportSlaCsv = (monitorId) => {
  SoundFX.play('click');
  const monitorsToExport = monitorId
    ? state.monitors.filter((m) => m.id === monitorId)
    : state.monitors;

  if (monitorsToExport.length === 0) {
    alert('No monitor data available to export.');
    return;
  }

  const headers = ['Monitor Name', 'Target URL', 'Status', 'Method', 'Interval (s)', '24h Uptime (%)', '30d Uptime (%)', 'Avg Latency (ms)', 'SSL Expiry', 'Last Checked'];
  const rows = monitorsToExport.map((m) => [
    `"${(m.name || '').replace(/"/g, '""')}"`,
    `"${(m.url || '').replace(/"/g, '""')}"`,
    m.status || 'PENDING',
    m.method || 'GET',
    m.interval || 60,
    m.uptime24h || 100,
    m.uptime30d || 100,
    m.avgLatency24h || 0,
    m.sslInfo && m.sslInfo.validTo ? new Date(m.sslInfo.validTo).toISOString().split('T')[0] : 'N/A',
    m.lastChecked ? new Date(m.lastChecked).toISOString() : 'Never'
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  const filename = monitorId && monitorsToExport[0]
    ? `pulseguard-sla-${monitorsToExport[0].name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.csv`
    : `pulseguard-sla-report-${new Date().toISOString().split('T')[0]}.csv`;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  SoundFX.play('success');
};

window.checkNow = async (id) => {
  SoundFX.play('click');
  state.checkingMonitorId = id;
  const list = document.getElementById('monitorsListContainer');
  if (list) list.innerHTML = renderMonitorsCardsList();

  await api.checkNow(id);
  const hbs = await api.getHeartbeats(id, 35);
  state.heartbeatsMap[id] = hbs;
  state.checkingMonitorId = null;
  SoundFX.play('success');
  await fetchAllData();
};

window.togglePause = async (id) => {
  await api.togglePause(id);
  await fetchAllData();
};

window.deleteMonitor = async (id) => {
  if (confirm('Delete this monitor?')) {
    await api.deleteMonitor(id);
    await fetchAllData();
  }
};

window.setMaintenanceMode = async (id, val) => {
  SoundFX.play('click');
  let maintenanceUntil = null;
  const now = Date.now();
  if (val === '1h') maintenanceUntil = new Date(now + 3600 * 1000).toISOString();
  else if (val === '4h') maintenanceUntil = new Date(now + 4 * 3600 * 1000).toISOString();
  else if (val === '24h') maintenanceUntil = new Date(now + 24 * 3600 * 1000).toISOString();

  await api.updateMonitor(id, { maintenanceUntil });
  SoundFX.play('success');
  await fetchAllData();
};

window.saveMonitor = async (e) => {
  e.preventDefault();
  const name = document.getElementById('mName').value;
  const url = document.getElementById('mUrl').value;
  const method = document.getElementById('mMethod').value;
  const group = document.getElementById('mGroup').value;
  const interval = Number(document.getElementById('mInterval').value);
  const timeout = Number(document.getElementById('mTimeout').value);
  const expectedStatus = Number(document.getElementById('mExpectedStatus').value);
  const keyword = document.getElementById('mKeyword').value;
  const sslCheckEnabled = document.getElementById('mSslCheck').checked;
  const sslAlertDaysThreshold = Number(document.getElementById('mSslDays').value);

  let headers = {};
  const rawHeaders = document.getElementById('mHeaders')?.value.trim();
  if (rawHeaders) {
    try {
      headers = JSON.parse(rawHeaders);
    } catch {
      alert('Invalid JSON in Custom Headers field. Please format as valid JSON object.');
      return;
    }
  }
  const body = document.getElementById('mBody')?.value.trim() || '';

  const payload = {
    name,
    url,
    method,
    group,
    interval,
    timeout,
    expectedStatus,
    keyword,
    sslCheckEnabled,
    sslAlertDaysThreshold,
    headers,
    body,
  };

  if (state.editingMonitor) {
    await api.updateMonitor(state.editingMonitor.id, payload);
  } else {
    await api.createMonitor(payload);
  }
  window.closeModals();
  await fetchAllData();
};

window.openNewIncidentModal = () => {
  state.showNewIncidentModal = true;
  renderModals();
};

window.saveNewIncident = async (e) => {
  e.preventDefault();
  const title = document.getElementById('incTitle').value;
  const cause = document.getElementById('incCause').value;
  const initialMessage = document.getElementById('incMsg').value;
  await api.createIncident({ title, cause, initialMessage, status: 'INVESTIGATING' });
  window.closeModals();
  await fetchAllData();
};

window.openAddIncidentUpdate = (id) => {
  state.activeIncidentId = id;
  renderModals();
};

window.saveIncidentUpdate = async (e) => {
  e.preventDefault();
  const status = document.getElementById('upStatus').value;
  const message = document.getElementById('upMessage').value;
  await api.addIncidentUpdate(state.activeIncidentId, status, message);
  window.closeModals();
  await fetchAllData();
};

window.openNewNotifModal = () => {
  state.editingNotif = null;
  state.showNotifModal = true;
  renderModals();
};

window.openEditNotif = (id) => {
  const notif = state.notifications.find((n) => n.id === id);
  if (notif) {
    state.editingNotif = notif;
    state.showNotifModal = true;
    renderModals();
  }
};

window.toggleNotifFields = (val) => {
  const d = document.getElementById('discordField');
  const t = document.getElementById('telegramFields');
  const em = document.getElementById('emailField');
  const w = document.getElementById('webhookField');
  if (d) d.classList.toggle('hidden', val !== 'discord');
  if (t) t.classList.toggle('hidden', val !== 'telegram');
  if (em) em.classList.toggle('hidden', val !== 'email');
  if (w) w.classList.toggle('hidden', val !== 'webhook');
};

window.saveNotification = async (e) => {
  e.preventDefault();
  const name = document.getElementById('nName').value;
  const type = document.getElementById('nType').value;
  const config = {};
  if (type === 'discord') config.discordWebhookUrl = document.getElementById('nDiscordUrl').value;
  if (type === 'telegram') {
    config.telegramBotToken = document.getElementById('nTgToken').value;
    config.telegramChatId = document.getElementById('nTgChat').value;
  }
  if (type === 'email') {
    config.emailRecipient = document.getElementById('nEmail').value;
  }
  if (type === 'webhook') config.webhookUrl = document.getElementById('nWebhookUrl').value;

  const payload = { name, type, config, enabled: true, events: ['down', 'up', 'ssl_warning'] };

  if (state.editingNotif) {
    await api.updateNotification(state.editingNotif.id, payload);
  } else {
    await api.createNotification(payload);
  }
  window.closeModals();
  await fetchAllData();
};

window.toggleChannel = async (id, enabled) => {
  await api.updateNotification(id, { enabled });
  await fetchAllData();
};

window.deleteChannel = async (id) => {
  if (confirm('Delete this notification channel?')) {
    await api.deleteNotification(id);
    await fetchAllData();
  }
};

window.testChannel = async (id) => {
  state.testingNotifId = id;
  const tab = document.getElementById('tabContentContainer');
  if (tab && state.activeTab === 'alerts') tab.innerHTML = renderAlertsTab();

  const res = await api.testNotification(id);
  state.testResult = { id, success: res.success, error: res.error };
  state.testingNotifId = null;
  if (tab && state.activeTab === 'alerts') tab.innerHTML = renderAlertsTab();

  setTimeout(() => {
    state.testResult = null;
    const currentTab = document.getElementById('tabContentContainer');
    if (currentTab && state.activeTab === 'alerts') currentTab.innerHTML = renderAlertsTab();
  }, 5000);
};

function attachEvents() {
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.oninput = (e) => {
      state.searchQuery = e.target.value;
      const list = document.getElementById('monitorsListContainer');
      if (list) {
        list.innerHTML = renderMonitorsCardsList();
      }
    };
  }

  const groupSelect = document.getElementById('groupSelect');
  if (groupSelect) {
    groupSelect.onchange = (e) => {
      state.selectedGroup = e.target.value;
      const list = document.getElementById('monitorsListContainer');
      if (list) {
        list.innerHTML = renderMonitorsCardsList();
      }
    };
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.closeModals();
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

render();
fetchAllData();
setInterval(fetchAllData, 4000);
