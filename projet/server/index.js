const path = require('path');
const { config } = require('dotenv');

config({ path: path.join(__dirname, '.env'), override: false });
config({ path: path.join(__dirname, '..', '.env'), override: false });

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

const defaultTokens = ['COLLAB-12345', 'COLLAB-PAINT', 'COLLAB-TEAM'];
const allowedTokens = new Set(
  (process.env.ALLOWED_TOKENS || defaultTokens.join(',')).split(',').map((token) => token.trim()).filter(Boolean)
);

const usersByRoom = new Map();
const workspaceByRoom = new Map();

const stats = {
  eventsThisMinute: 0,
  eventsPerMinute: 0
};

setInterval(() => {
  stats.eventsPerMinute = stats.eventsThisMinute;
  stats.eventsThisMinute = 0;
  logStatus('minute-snapshot');
}, 60_000).unref();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

app.get('/status', (req, res) => {
  res.json({
    activeConnections: io.engine.clientsCount,
    eventsPerMinute: stats.eventsPerMinute,
    rooms: getActiveRooms().map((room) => ({
      name: room,
      users: getRoomUsers(room).length
    }))
  });
});

app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

io.use((socket, next) => {
  const { token, pseudo, room } = socket.handshake.auth || {};

  const cleanToken = sanitizeToken(token);
  const cleanPseudo = sanitizePseudo(pseudo);
  const cleanRoom = sanitizeRoom(room);

  if (!cleanToken || !allowedTokens.has(cleanToken)) {
    return next(new Error('INVALID_TOKEN'));
  }
  if (!cleanPseudo || !cleanRoom) {
    return next(new Error('MISSING_CREDENTIALS'));
  }

  socket.data.user = { pseudo: cleanPseudo, room: cleanRoom, token: cleanToken };
  return next();
});

io.on('connection', (socket) => {
  const user = socket.data.user;
  const room = user.room;

  socket.join(room);
  registerUser(room, socket.id, user.pseudo);
  emitRoomUsers(room);

  const workspace = getRoomState(room);
  socket.emit('workspace:init', {
    text: workspace.text,
    textVersion: workspace.textVersion,
    strokes: workspace.strokes,
    strokeVersion: workspace.strokeVersion
  });

  io.to(room).emit('notification', buildNotification('join', user.pseudo));
  logStatus(`user-joined:${room}`);

  socket.on('update', (payload) => {
    handleTextUpdate(socket, payload);
  });

  socket.on('typing', (isTyping) => {
    socket.to(room).emit('typing', {
      user: user.pseudo,
      isTyping: Boolean(isTyping)
    });
  });

  socket.on('drawing', (payload) => {
    handleDrawing(socket, payload);
  });

  socket.on('canvas:clear', () => {
    const state = getRoomState(room);
    state.strokes = [];
    state.strokeVersion += 1;
    incrementEvent();
    io.to(room).emit('canvas:clear', {
      author: user.pseudo,
      strokeVersion: state.strokeVersion,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', () => {
    unregisterUser(room, socket.id);
    emitRoomUsers(room);
    io.to(room).emit('notification', buildNotification('leave', user.pseudo));
    maybeCleanupRoom(room);
    logStatus(`user-left:${room}`);
  });
});

async function setupRedisAdapter() {
  if (!process.env.REDIS_URL) {
    console.log('Redis adapter disabled (REDIS_URL not set).');
    return;
  }

  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Redis adapter enabled.');
}

setupRedisAdapter().catch((error) => {
  console.error('Redis adapter init failed:', error.message);
});

function handleTextUpdate(socket, payload = {}) {
  const room = socket.data.user.room;
  const state = getRoomState(room);

  if (typeof payload.content !== 'string') {
    return;
  }

  state.text = payload.content;
  state.textVersion += 1;
  incrementEvent();

  io.to(room).emit('update', {
    type: 'text',
    content: state.text,
    version: state.textVersion,
    author: socket.data.user.pseudo,
    cursor: payload.cursor ?? null,
    timestamp: Date.now()
  });
}

function handleDrawing(socket, payload = {}) {
  const room = socket.data.user.room;
  const state = getRoomState(room);
  const points = Array.isArray(payload.points) ? payload.points : [];

  if (!points.length) {
    return;
  }

  const stroke = {
    id: payload.id || `stroke_${nanoid(8)}`,
    points: points.map((point) => ({ x: point.x, y: point.y })),
    color: payload.color || '#111827',
    size: Number(payload.size) || 2,
    tool: payload.tool || 'pen',
    author: socket.data.user.pseudo,
    timestamp: Date.now()
  };

  state.strokes.push(stroke);
  state.strokes = state.strokes.slice(-1000);
  state.strokeVersion += 1;
  incrementEvent();

  socket.to(room).emit('drawing', stroke);
}

function registerUser(room, socketId, pseudo) {
  const roomUsers = usersByRoom.get(room) || new Map();
  roomUsers.set(socketId, { pseudo });
  usersByRoom.set(room, roomUsers);
}

function unregisterUser(room, socketId) {
  const roomUsers = usersByRoom.get(room);
  if (!roomUsers) return;
  roomUsers.delete(socketId);
  if (!roomUsers.size) {
    usersByRoom.delete(room);
  }
}

function emitRoomUsers(room) {
  io.to(room).emit('room:users', getRoomUsers(room));
}

function getRoomUsers(room) {
  return Array.from(usersByRoom.get(room)?.values() || []).map((user) => user.pseudo);
}

function getRoomState(room) {
  if (!workspaceByRoom.has(room)) {
    workspaceByRoom.set(room, {
      text: '',
      textVersion: 0,
      strokes: [],
      strokeVersion: 0
    });
  }
  return workspaceByRoom.get(room);
}

function maybeCleanupRoom(room) {
  if (!usersByRoom.has(room)) {
    workspaceByRoom.delete(room);
  }
}

function sanitizePseudo(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\s+/g, ' ').slice(0, 32);
}

function sanitizeRoom(value) {
  if (typeof value !== 'string') return '';
  const clean = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return clean.slice(0, 40) || 'general';
}

function sanitizeToken(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function buildNotification(type, pseudo) {
  const base = {
    type,
    user: pseudo,
    timestamp: Date.now()
  };
  return {
    ...base,
    message:
      type === 'join'
        ? `${pseudo} a rejoint la session`
        : type === 'leave'
        ? `${pseudo} a quitte la session`
        : `${pseudo} a mis a jour l'espace`
  };
}

function incrementEvent() {
  stats.eventsThisMinute += 1;
}

function getActiveRooms() {
  return Array.from(usersByRoom.keys());
}

function logStatus(context) {
  console.log(
    `[monitoring] ctx=${context} connections=${io.engine.clientsCount} rooms=${getActiveRooms().length} events/min=${stats.eventsPerMinute}`
  );
}

const shutdown = () => {
  console.log('Shutting down CollabBoard server...');
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

server.listen(PORT, HOST, () => {
  console.log(`CollabBoard server listening on http://${HOST}:${PORT}`);
  console.log('Tokens acceptes:', Array.from(allowedTokens).join(', '));
});
