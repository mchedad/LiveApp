const API_BASE = '';
const STORAGE_KEY = 'exo8-session-token';

const elements = {
  authForms: document.querySelector('#auth-forms'),
  registerForm: document.querySelector('#register-form'),
  loginForm: document.querySelector('#login-form'),
  authError: document.querySelector('#auth-error'),
  sessionInfo: document.querySelector('#session-info'),
  sessionUsername: document.querySelector('#session-username'),
  logoutBtn: document.querySelector('#logout-btn'),
  composer: document.querySelector('#composer'),
  itemForm: document.querySelector('#item-form'),
  itemInput: document.querySelector('#item-content'),
  itemsList: document.querySelector('#items-list'),
  usersList: document.querySelector('#users-list'),
  connectionState: document.querySelector('#connection-state'),
  metrics: {
    connections: document.querySelector('#metric-connections'),
    epm: document.querySelector('#metric-epm'),
    latency: document.querySelector('#metric-latency'),
    items: document.querySelector('#metric-items'),
    updated: document.querySelector('#metric-updated'),
  },
  eventLog: document.querySelector('#event-log'),
};

const state = {
  token: localStorage.getItem(STORAGE_KEY) || null,
  user: null,
  socket: null,
  items: [],
  users: [],
  latencyTimer: null,
  monitorTimer: null,
  pendingActions: [],
};

function logEvent(message) {
  const li = document.createElement('li');
  li.textContent = `${new Date().toLocaleTimeString()} — ${message}`;
  elements.eventLog.prepend(li);
  while (elements.eventLog.children.length > 12) {
    elements.eventLog.removeChild(elements.eventLog.lastChild);
  }
}

async function http(path, options = {}) {
  const headers = options.headers ? { ...options.headers } : {};
  headers['Content-Type'] = 'application/json';
  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    const message = errorPayload.error || 'Erreur serveur';
    throw new Error(message);
  }
  return response.json().catch(() => ({}));
}

function setSession({ user, token }) {
  state.user = user;
  state.token = token ?? state.token;
  if (state.token) {
     localStorage.setItem(STORAGE_KEY, state.token);
  }
  elements.sessionInfo.classList.remove('hidden');
  elements.sessionUsername.textContent = user.username;
  elements.authForms.classList.add('hidden');
  elements.composer.classList.remove('hidden');
}

function clearSession() {
  state.user = null;
  state.token = null;
  localStorage.removeItem(STORAGE_KEY);
  state.items = [];
  state.pendingActions = [];
  elements.sessionInfo.classList.add('hidden');
  elements.authForms.classList.remove('hidden');
  elements.composer.classList.add('hidden');
  updateConnectionBadge('Déconnecté', 'badge-idle');
  teardownSocket();
  stopMonitoringLoop();
  renderItems();
  renderUsers([]);
}

function updateConnectionBadge(text, badgeClass) {
  elements.connectionState.textContent = text;
  elements.connectionState.className = `badge ${badgeClass}`;
}

function renderItems() {
  elements.itemsList.innerHTML = '';
  state.items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'item';
    const content = document.createElement('div');
    const strong = document.createElement('strong');
    strong.textContent = item.content;
    content.appendChild(strong);
    const meta = document.createElement('div');
    meta.className = 'meta';
    const owner = item.ownerId === state.user?.id ? 'Vous' : item.ownerName;
    meta.textContent = `${owner} • v${item.version}`;
    content.appendChild(meta);
    li.appendChild(content);

    if (item.ownerId === state.user?.id) {
      const actions = document.createElement('div');
      actions.className = 'item-actions';
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.textContent = 'Éditer';
      editBtn.addEventListener('click', () => handleEditItem(item));
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Supprimer';
      deleteBtn.addEventListener('click', () => handleDeleteItem(item));
      actions.append(editBtn, deleteBtn);
      li.appendChild(actions);
    }
    elements.itemsList.appendChild(li);
  });
}

function renderUsers(users) {
  elements.usersList.innerHTML = '';
  users.forEach((user) => {
    const li = document.createElement('li');
    const label = user.id === state.user?.id ? `${user.username} (vous)` : user.username;
    li.textContent = `${label} · vu ${new Date(user.lastSeen).toLocaleTimeString()}`;
    elements.usersList.appendChild(li);
  });
}

function updateMetrics(snapshot) {
  if (!snapshot) return;
  elements.metrics.connections.textContent = snapshot.activeConnections ?? 0;
  elements.metrics.epm.textContent = snapshot.eventsPerMinute ?? 0;
  elements.metrics.items.textContent = snapshot.totalItems ?? state.items.length;
  if (typeof snapshot.avgLatencyMs === 'number') {
    elements.metrics.latency.textContent = `${snapshot.avgLatencyMs} ms`;
  }
  elements.metrics.updated.textContent = snapshot.lastSyncAt ? `MAJ ${new Date(snapshot.lastSyncAt).toLocaleTimeString()}` : '—';
  if (Array.isArray(snapshot.logs)) {
    snapshot.logs.slice(-5).forEach((entry) => logEvent(entry));
  }
}

async function refreshMonitoring() {
  try {
    const data = await http('/api/monitoring');
    updateMetrics(data);
  } catch (error) {
    console.warn('Monitoring indisponible', error.message);
  }
}

function handleEditItem(item) {
  const nextContent = prompt('Nouveau contenu', item.content);
  if (!nextContent) return;
  emitOrQueue('items:update', { id: item.id, content: nextContent }, (response) => {
    if (!response?.ok) {
      console.warn(response?.error || 'Mise à jour impossible');
    }
  });
}

function handleDeleteItem(item) {
  if (!confirm('Supprimer cet item ?')) return;
  emitOrQueue('items:delete', { id: item.id }, (response) => {
    if (!response?.ok) {
      console.warn(response?.error || 'Suppression impossible');
    }
  });
}

elements.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.authError.textContent = '';
  const formData = new FormData(event.target);
  try {
    const payload = {
      username: formData.get('username'),
      password: formData.get('password'),
    };
    const data = await http('/api/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSession(data);
    connectSocket();
    startMonitoringLoop();
  } catch (error) {
    elements.authError.textContent = error.message;
  }
});

elements.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  elements.authError.textContent = '';
  const formData = new FormData(event.target);
  try {
    const payload = {
      username: formData.get('username'),
      password: formData.get('password'),
    };
    const data = await http('/api/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSession(data);
    connectSocket();
    startMonitoringLoop();
  } catch (error) {
    elements.authError.textContent = error.message;
  }
});

elements.logoutBtn.addEventListener('click', async () => {
  try {
    await http('/api/logout', { method: 'POST' });
  } catch (error) {
    console.warn('logout', error.message);
  } finally {
    clearSession();
  }
});

elements.itemForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const content = elements.itemInput.value.trim();
  if (!content) return;
  emitOrQueue('items:create', { content }, (response) => {
    if (!response?.ok) {
      console.warn(response?.error || 'Création impossible');
    } else {
      elements.itemInput.value = '';
    }
  });
});

function emitOrQueue(event, payload, callback) {
  if (state.socket && state.socket.connected) {
    const emitter = state.socket.timeout(5000);
    if (typeof callback === 'function') {
      emitter.emit(event, payload, callback);
    } else {
      emitter.emit(event, payload);
    }
  } else {
    state.pendingActions.push({ event, payload, callback });
    logEvent(`Action mise en file (${event})`);
  }
}

function flushPendingActions() {
  while (state.pendingActions.length && state.socket?.connected) {
    const action = state.pendingActions.shift();
    if (typeof action.callback === 'function') {
      state.socket.emit(action.event, action.payload, action.callback);
    } else {
      state.socket.emit(action.event, action.payload);
    }
  }
}

function setupSocketListeners(socket) {
  socket.on('connect', () => {
    updateConnectionBadge('Connecté', 'badge-live');
    logEvent('Connecté au serveur temps réel.');
    flushPendingActions();
    startLatencyLoop();
  });

  socket.on('disconnect', (reason) => {
    updateConnectionBadge(`Déconnecté (${reason})`, 'badge-error');
    logEvent(`Déconnexion : ${reason}`);
    stopLatencyLoop();
  });

  socket.on('connect_error', (error) => {
    updateConnectionBadge('Erreur de connexion', 'badge-error');
    logEvent(`Erreur socket : ${error.message}`);
  });

  socket.on('items:init', (items) => {
    state.items = items;
    renderItems();
  });

  socket.on('items:created', (item) => {
    state.items.push(item);
    renderItems();
  });

  socket.on('items:updated', (item) => {
    const index = state.items.findIndex((entry) => entry.id === item.id);
    if (index !== -1) {
      state.items[index] = item;
      renderItems();
    }
  });

  socket.on('items:deleted', ({ id }) => {
    state.items = state.items.filter((item) => item.id !== id);
    renderItems();
  });

  socket.on('users:list', (users) => {
    state.users = users;
    renderUsers(users);
  });

  socket.on('latency:pong', ({ clientTimestamp }) => {
    const rtt = Date.now() - clientTimestamp;
    elements.metrics.latency.textContent = `${rtt} ms`;
    socket.emit('latency:report', { roundTripMs: rtt });
  });
}

function startLatencyLoop() {
  stopLatencyLoop();
  state.latencyTimer = setInterval(() => {
    if (state.socket?.connected) {
      state.socket.emit('latency:ping', Date.now());
    }
  }, 5000);
}

function stopLatencyLoop() {
  if (state.latencyTimer) {
    clearInterval(state.latencyTimer);
    state.latencyTimer = null;
  }
}

function teardownSocket() {
  stopLatencyLoop();
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
}

function connectSocket() {
  teardownSocket();
  if (!state.token) return;
  const socket = io({
    autoConnect: true,
    auth: { token: state.token },
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 4000,
  });
  state.socket = socket;
  setupSocketListeners(socket);
}

function startMonitoringLoop() {
  stopMonitoringLoop();
  refreshMonitoring();
  state.monitorTimer = setInterval(refreshMonitoring, 15000);
}

function stopMonitoringLoop() {
  if (state.monitorTimer) {
    clearInterval(state.monitorTimer);
    state.monitorTimer = null;
  }
}

async function bootstrap() {
  if (!state.token) {
    clearSession();
    return;
  }
  try {
    const data = await http('/api/session');
    setSession({ user: data.user, token: state.token });
    connectSocket();
    startMonitoringLoop();
  } catch (error) {
    console.warn('session', error.message);
    clearSession();
  }
}

bootstrap();
