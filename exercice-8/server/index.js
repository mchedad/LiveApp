require('dotenv').config();

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const {
  registerUser,
  loginUser,
  createAuthSession,
  resolveSession,
  revokeSession,
} = require('./lib/auth');
const { nanoid } = require('nanoid');
const {
  listItems,
  insertItem,
  updateItem,
  deleteItem,
  countItems,
} = require('./lib/database');
const { sanitizeItemContent, readAuthToken } = require('./lib/validators');
const { assertWithinRateLimit } = require('./lib/rateLimiter');
const {
  trackConnection,
  recordEvent,
  recordLatencySample,
  getMetricsSnapshot,
} = require('./lib/monitoring');

const PORT = Number(process.env.PORT) || 4700;
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const onlineUsers = new Map();

app.use(cors());
app.use(express.json());
app.use(helmet({ crossOriginEmbedderPolicy: false, contentSecurityPolicy: false }));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, '..', 'client')));

function requireAuth(req, res, next) {
  const token = readAuthToken(req.headers.authorization || req.headers['x-session-token']);
  const session = resolveSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session invalide.' });
  }
  req.user = session.user;
  req.sessionToken = token;
  return next();
}

function nextItemId() {
  return `item_${nanoid(10)}`;
}

app.post('/api/register', (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    const user = registerUser({ username, password });
    const token = createAuthSession(user.id);
    recordEvent('auth:register');
    return res.status(201).json({ user, token });
  } catch (error) {
    if (error.code === 'USERNAME_TAKEN') {
      return res.status(409).json({ error: 'Ce pseudo est déjà utilisé.' });
    }
    if (error.code === 'INVALID_USERNAME') {
      return res.status(400).json({ error: 'Pseudo invalide (3-24 caractères).' });
    }
    if (error.code === 'INVALID_PASSWORD') {
      return res.status(400).json({ error: 'Le mot de passe doit contenir 6 caractères minimum.' });
    }
    console.error('register error', error);
    return res.status(500).json({ error: 'Inscription impossible.' });
  }
});

app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body ?? {};
    const user = loginUser({ username, password });
    const token = createAuthSession(user.id);
    recordEvent('auth:login');
    return res.json({ user, token });
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });
    }
    console.error('login error', error);
    return res.status(500).json({ error: 'Connexion impossible.' });
  }
});

app.post('/api/logout', requireAuth, (req, res) => {
  revokeSession(req.sessionToken);
  recordEvent('auth:logout');
  return res.json({ ok: true });
});

app.get('/api/session', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

app.get('/api/items', requireAuth, (_req, res) => {
  const items = listItems();
  return res.json({ items });
});

app.get('/api/monitoring', (req, res) => {
  const snapshot = getMetricsSnapshot({ totalItems: countItems() });
  return res.json(snapshot);
});

app.post('/api/items', requireAuth, (req, res) => {
  try {
    assertWithinRateLimit(req.user.id);
    const content = sanitizeItemContent(req.body?.content);
    if (!content) {
      return res.status(400).json({ error: 'Contenu requis.' });
    }
    const now = new Date().toISOString();
    const item = insertItem({
      id: nextItemId(),
      content,
      ownerId: req.user.id,
      ownerName: req.user.username,
      now,
    });
    recordEvent('item:create');
    io.emit('items:created', item);
    return res.status(201).json({ item });
  } catch (error) {
    if (error.code === 'RATE_LIMITED') {
      return res.status(429).json({ error: 'Trop de requêtes.', retryAfter: error.retryAfter });
    }
    console.error('create item error', error);
    return res.status(500).json({ error: 'Création impossible.' });
  }
});

app.put('/api/items/:id', requireAuth, (req, res) => {
  try {
    assertWithinRateLimit(req.user.id);
    const content = sanitizeItemContent(req.body?.content);
    if (!content) {
      return res.status(400).json({ error: 'Contenu requis.' });
    }
    const now = new Date().toISOString();
    const item = updateItem({
      id: req.params.id,
      content,
      ownerId: req.user.id,
      now,
    });
    if (!item) {
      return res.status(404).json({ error: 'Item introuvable.' });
    }
    recordEvent('item:update');
    io.emit('items:updated', item);
    return res.json({ item });
  } catch (error) {
    if (error.code === 'FORBIDDEN_ITEM_OWNER') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }
    if (error.code === 'RATE_LIMITED') {
      return res.status(429).json({ error: 'Trop de requêtes.', retryAfter: error.retryAfter });
    }
    console.error('update item error', error);
    return res.status(500).json({ error: 'Mise à jour impossible.' });
  }
});

app.delete('/api/items/:id', requireAuth, (req, res) => {
  try {
    assertWithinRateLimit(req.user.id);
    const deleted = deleteItem({ id: req.params.id, ownerId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ error: 'Item introuvable.' });
    }
    recordEvent('item:delete');
    io.emit('items:deleted', { id: req.params.id });
    return res.json({ ok: true });
  } catch (error) {
    if (error.code === 'FORBIDDEN_ITEM_OWNER') {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }
    if (error.code === 'RATE_LIMITED') {
      return res.status(429).json({ error: 'Trop de requêtes.', retryAfter: error.retryAfter });
    }
    console.error('delete item error', error);
    return res.status(500).json({ error: 'Suppression impossible.' });
  }
});

function broadcastOnlineUsers() {
  const users = Array.from(onlineUsers.values()).map((entry) => ({
    id: entry.user.id,
    username: entry.user.username,
    lastSeen: entry.lastSeen,
  }));
  io.emit('users:list', users);
}

function touchOnlineUser(socket) {
  const entry = onlineUsers.get(socket.id);
  if (!entry) return;
  entry.lastSeen = new Date().toISOString();
  onlineUsers.set(socket.id, entry);
}

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  const session = resolveSession(token);
  if (!session) {
    return next(new Error('AUTH_REQUIRED'));
  }
  socket.data.user = session.user;
  socket.data.sessionToken = token;
  return next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  trackConnection(1);
  onlineUsers.set(socket.id, {
    user,
    lastSeen: new Date().toISOString(),
  });
  broadcastOnlineUsers();
  socket.emit('items:init', listItems());

  socket.on('items:create', (payload, callback) => {
    try {
      touchOnlineUser(socket);
      assertWithinRateLimit(user.id);
      const content = sanitizeItemContent(payload?.content);
      if (!content) {
        throw new Error('INVALID_CONTENT');
      }
      const now = new Date().toISOString();
      const item = insertItem({
        id: nextItemId(),
        content,
        ownerId: user.id,
        ownerName: user.username,
        now,
      });
      recordEvent('ws:item:create');
      io.emit('items:created', item);
      callback?.({ ok: true, item });
    } catch (error) {
      if (error.code === 'RATE_LIMITED') {
        return callback?.({ ok: false, error: 'Trop de requêtes.' });
      }
      return callback?.({ ok: false, error: 'Impossible de créer cet item.' });
    }
  });

  socket.on('items:update', (payload, callback) => {
    try {
      touchOnlineUser(socket);
      assertWithinRateLimit(user.id);
      const content = sanitizeItemContent(payload?.content);
      if (!content) {
        throw new Error('INVALID_CONTENT');
      }
      const now = new Date().toISOString();
      const item = updateItem({
        id: payload?.id,
        content,
        ownerId: user.id,
        now,
      });
      if (!item) {
        return callback?.({ ok: false, error: 'Item introuvable.' });
      }
      recordEvent('ws:item:update');
      io.emit('items:updated', item);
      callback?.({ ok: true, item });
    } catch (error) {
      if (error.code === 'FORBIDDEN_ITEM_OWNER') {
        return callback?.({ ok: false, error: 'Action non autorisée.' });
      }
      if (error.code === 'RATE_LIMITED') {
        return callback?.({ ok: false, error: 'Trop de requêtes.' });
      }
      return callback?.({ ok: false, error: 'Impossible de modifier cet item.' });
    }
  });

  socket.on('items:delete', (payload, callback) => {
    try {
      touchOnlineUser(socket);
      assertWithinRateLimit(user.id);
      const result = deleteItem({ id: payload?.id, ownerId: user.id });
      if (!result) {
        return callback?.({ ok: false, error: 'Item introuvable.' });
      }
      recordEvent('ws:item:delete');
      io.emit('items:deleted', { id: payload?.id });
      callback?.({ ok: true });
    } catch (error) {
      if (error.code === 'FORBIDDEN_ITEM_OWNER') {
        return callback?.({ ok: false, error: 'Action non autorisée.' });
      }
      if (error.code === 'RATE_LIMITED') {
        return callback?.({ ok: false, error: 'Trop de requêtes.' });
      }
      return callback?.({ ok: false, error: 'Impossible de supprimer cet item.' });
    }
  });

  socket.on('latency:ping', (clientTimestamp) => {
    const serverTime = Date.now();
    socket.emit('latency:pong', { clientTimestamp, serverTime });
  });

  socket.on('latency:report', (payload) => {
    if (!payload) return;
     touchOnlineUser(socket);
    recordLatencySample(Number(payload.roundTripMs));
    broadcastOnlineUsers();
  });

  socket.on('disconnect', (reason) => {
    trackConnection(-1);
    onlineUsers.delete(socket.id);
    broadcastOnlineUsers();
    console.log(`socket disconnected ${socket.id} (${reason})`);
  });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error', err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

server.listen(PORT, HOST, () => {
  console.log(`Exercice 8 server running at http://${HOST}:${PORT}`);
});
