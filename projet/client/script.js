const ui = {
  form: document.getElementById('joinForm'),
  overlay: document.querySelector('.connection-overlay'),
  status: document.getElementById('connectionStatus'),
  disconnect: document.getElementById('disconnectBtn'),
  textArea: document.getElementById('collabText'),
  userList: document.getElementById('userList'),
  notifications: document.getElementById('notifications'),
  statusSummary: document.getElementById('statusSummary'),
  roomName: document.getElementById('roomName'),
  typingIndicator: document.getElementById('typingIndicator'),
  modeSelect: document.getElementById('modeSelect'),
  canvas: document.getElementById('board'),
  clearCanvas: document.getElementById('clearCanvas'),
  colorPicker: document.getElementById('colorPicker'),
  sizePicker: document.getElementById('sizePicker'),
  formError: document.getElementById('formError')
};

const state = {
  socket: null,
  pseudo: '',
  room: '',
  token: '',
  mode: 'dual',
  strokes: [],
  isDrawing: false,
  currentStroke: null,
  textTimer: null,
  typingTimer: null,
  canvasCtx: null,
  canvasSize: { width: 0, height: 0 },
  brushColor: '#f97316',
  brushSize: 3
};

const TEXT_DEBOUNCE = 180;
const STATUS_REFRESH = 15_000;

function init() {
  if (!ui.form) return;

  ui.form.addEventListener('submit', handleJoin);
  ui.disconnect.addEventListener('click', forceDisconnect);
  ui.modeSelect.addEventListener('change', (event) => {
    state.mode = event.target.value;
    applyMode();
  });
  ui.textArea.addEventListener('input', handleLocalTextChange);
  ui.textArea.addEventListener('focus', () => emitTyping(true));
  ui.textArea.addEventListener('blur', () => emitTyping(false));
  ui.clearCanvas.addEventListener('click', emitCanvasClear);
  ui.colorPicker.addEventListener('input', () => {
    state.brushColor = ui.colorPicker.value;
  });
  ui.sizePicker.addEventListener('input', () => {
    state.brushSize = Number(ui.sizePicker.value) || 2;
  });

  setupCanvas();
  window.addEventListener('resize', () => {
    resizeCanvas();
    redrawCanvas();
  });

  setStatus('idle', 'Hors ligne');
  ui.textArea.disabled = true;
  ui.form.room.value = 'general';
  ui.form.token.value = 'COLLAB-12345';

  pollStatus();
  window.setInterval(pollStatus, STATUS_REFRESH);
}

function handleJoin(event) {
  event.preventDefault();
  if (state.socket?.connected) return;

  const formData = new FormData(ui.form);
  const pseudo = formData.get('pseudo')?.trim();
  const room = formData.get('room')?.trim();
  const token = formData.get('token')?.trim();
  const mode = formData.get('mode');

  if (!pseudo || !room || !token) {
    displayFormError('Pseudo, room et token requis.');
    return;
  }

  state.pseudo = pseudo;
  state.room = room;
  state.token = token;
  state.mode = mode;

  connectSocket();
}

function connectSocket() {
  setStatus('connecting', 'Connexion...');
  ui.formError.textContent = '';

  const socket = io({
    auth: {
      pseudo: state.pseudo,
      room: state.room,
      token: state.token
    },
    transports: ['websocket']
  });

  state.socket = socket;
  registerSocketEvents(socket);
}

function registerSocketEvents(socket) {
  socket.on('connect', () => {
    setStatus('connected', `Connecte sur ${state.room}`);
    toggleOverlay(false);
    ui.textArea.disabled = false;
    ui.roomName.textContent = state.room;
    applyMode();
    pollStatus();
  });

  socket.on('disconnect', (reason) => {
    setStatus('idle', `Deconnecte (${reason})`);
    ui.textArea.disabled = true;
    toggleOverlay(true);
  });

  socket.io.on('error', (error) => {
    displayFormError(error.message || 'Erreur de connexion');
    setStatus('error', 'Erreur');
  });

  socket.on('connect_error', (error) => {
    displayFormError(error.message || 'Token invalide');
    setStatus('error', 'Connexion refusee');
  });

  socket.on('workspace:init', (payload) => {
    state.strokes = payload.strokes || [];
    ui.textArea.value = payload.text || '';
    redrawCanvas();
  });

  socket.on('update', (payload) => {
    if (payload.type !== 'text' || payload.author === state.pseudo) return;
    const scrollTop = ui.textArea.scrollTop;
    ui.textArea.value = payload.content;
    ui.textArea.scrollTop = scrollTop;
  });

  socket.on('typing', ({ user, isTyping }) => {
    if (user === state.pseudo) return;
    ui.typingIndicator.textContent = isTyping ? `${user} ecrit...` : '\u00A0';
  });

  socket.on('room:users', updateUsers);
  socket.on('notification', pushNotification);

  socket.on('drawing', (stroke) => {
    state.strokes.push(stroke);
    limitStrokeBuffer();
    drawStroke(stroke);
  });

  socket.on('canvas:clear', () => {
    state.strokes = [];
    clearCanvasSurface();
  });
}

function handleLocalTextChange() {
  emitTyping(true);
  clearTimeout(state.textTimer);
  state.textTimer = setTimeout(() => {
    if (!state.socket?.connected) return;
    state.socket.emit('update', {
      content: ui.textArea.value,
      cursor: ui.textArea.selectionStart
    });
  }, TEXT_DEBOUNCE);
}

function emitTyping(flag) {
  if (!state.socket?.connected) return;
  if (flag) {
    state.socket.emit('typing', true);
    clearTimeout(state.typingTimer);
    state.typingTimer = setTimeout(() => emitTyping(false), 1_500);
  } else {
    state.socket.emit('typing', false);
  }
}

function updateUsers(users = []) {
  ui.userList.innerHTML = users.map((name) => `<li>${name}</li>`).join('');
}

function pushNotification(payload) {
  const entry = document.createElement('div');
  entry.className = 'notification-item';
  const time = new Date(payload.timestamp).toLocaleTimeString();
  entry.textContent = `[${time}] ${payload.message}`;
  ui.notifications.prepend(entry);
  while (ui.notifications.children.length > 15) {
    ui.notifications.removeChild(ui.notifications.lastChild);
  }
}

async function pollStatus() {
  try {
    const response = await fetch('/status');
    if (!response.ok) return;
    const data = await response.json();
    ui.statusSummary.innerHTML = `
      <p>Connexions: ${data.activeConnections}</p>
      <p>Events/min: ${data.eventsPerMinute}</p>
      <p>Rooms actives: ${data.rooms.length}</p>
    `;
  } catch (_) {
    // pas critique
  }
}

function setStatus(stateName, label) {
  ui.status.dataset.state = stateName;
  ui.status.textContent = label;
}

function toggleOverlay(open) {
  ui.overlay.dataset.open = open ? 'true' : 'false';
}

function displayFormError(message) {
  ui.formError.textContent = message;
}

function forceDisconnect() {
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }
  setStatus('idle', 'Hors ligne');
  ui.textArea.disabled = true;
  toggleOverlay(true);
}

function applyMode() {
  ui.modeSelect.value = state.mode;
  document.querySelectorAll('.text-zone, .canvas-zone').forEach((section) => {
    const zoneMode = section.dataset.mode;
    const visible = state.mode === 'dual' || state.mode === zoneMode;
    section.style.display = visible ? 'flex' : 'none';
  });
}

function setupCanvas() {
  state.canvasCtx = ui.canvas.getContext('2d');
  resizeCanvas();
  ui.canvas.addEventListener('pointerdown', startStroke);
  ui.canvas.addEventListener('pointermove', drawCurrentStroke);
  window.addEventListener('pointerup', endStroke);
  ui.canvas.addEventListener('pointerleave', endStroke);
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  const width = ui.canvas.clientWidth || 800;
  const height = ui.canvas.clientHeight || 480;
  ui.canvas.width = width * ratio;
  ui.canvas.height = height * ratio;
  state.canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
  state.canvasCtx.scale(ratio, ratio);
  state.canvasSize = { width, height };
  redrawCanvas();
}

function startStroke(event) {
  if (!state.socket?.connected || state.mode === 'text') return;
  event.preventDefault();
  state.isDrawing = true;
  state.currentStroke = {
    id: `local_${(crypto.randomUUID && crypto.randomUUID()) || Date.now()}`,
    points: [],
    color: state.brushColor,
    size: state.brushSize,
    tool: 'pen'
  };
  addPoint(event);
}

function drawCurrentStroke(event) {
  if (!state.isDrawing) return;
  addPoint(event);
}

function endStroke() {
  if (!state.isDrawing) return;
  state.isDrawing = false;
  if (state.currentStroke && state.currentStroke.points.length > 1) {
    state.strokes.push(state.currentStroke);
    limitStrokeBuffer();
    state.socket.emit('drawing', state.currentStroke);
    drawStroke(state.currentStroke);
  }
  state.currentStroke = null;
}

function addPoint(event) {
  if (!state.currentStroke) return;
  const rect = ui.canvas.getBoundingClientRect();
  const normX = (event.clientX - rect.left) / state.canvasSize.width;
  const normY = (event.clientY - rect.top) / state.canvasSize.height;
  state.currentStroke.points.push({ x: normX, y: normY });
  drawStroke(state.currentStroke);
}

function drawStroke(stroke) {
  const ctx = state.canvasCtx;
  if (!ctx || stroke.points.length < 2) return;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  const [first] = stroke.points;
  ctx.moveTo(first.x * state.canvasSize.width, first.y * state.canvasSize.height);
  for (let i = 1; i < stroke.points.length; i += 1) {
    const point = stroke.points[i];
    ctx.lineTo(point.x * state.canvasSize.width, point.y * state.canvasSize.height);
  }
  ctx.stroke();
}

function redrawCanvas() {
  clearCanvasSurface();
  state.strokes.forEach((stroke) => drawStroke(stroke));
}

function clearCanvasSurface() {
  state.canvasCtx.clearRect(0, 0, ui.canvas.width, ui.canvas.height);
}

function emitCanvasClear() {
  if (!state.socket?.connected) return;
  state.socket.emit('canvas:clear');
}

function limitStrokeBuffer() {
  const max = 1000;
  if (state.strokes.length > max) {
    state.strokes.splice(0, state.strokes.length - max);
  }
}

init();
