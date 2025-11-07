const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { nanoid } = require('nanoid');
const {
  createUser,
  getUserByUsername,
  getUserById,
  createSession,
  getSession,
  deleteSession,
  touchSession,
} = require('./database');
const { sanitizeUsername } = require('./validators');

const APP_SECRET = process.env.APP_SECRET || 'local-dev-secret';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compareSync(password, passwordHash);
}

function hashToken(token) {
  return crypto.createHmac('sha256', APP_SECRET).update(token).digest('hex');
}

function generateUserId() {
  return `usr_${nanoid(16)}`;
}

function generateSessionToken() {
  return `sess_${nanoid(32)}`;
}

function registerUser({ username, password }) {
  const cleanUsername = sanitizeUsername(username);
  if (!cleanUsername) {
    const error = new Error('INVALID_USERNAME');
    error.code = 'INVALID_USERNAME';
    throw error;
  }
  if (getUserByUsername(cleanUsername)) {
    const error = new Error('USERNAME_TAKEN');
    error.code = 'USERNAME_TAKEN';
    throw error;
  }
  if (typeof password !== 'string' || password.length < 6) {
    const error = new Error('INVALID_PASSWORD');
    error.code = 'INVALID_PASSWORD';
    throw error;
  }
  const now = new Date().toISOString();
  const user = createUser({
    id: generateUserId(),
    username: cleanUsername,
    passwordHash: hashPassword(password),
    createdAt: now,
  });
  return sanitizeUser(user);
}

function loginUser({ username, password }) {
  const cleanUsername = sanitizeUsername(username);
  const user = cleanUsername ? getUserByUsername(cleanUsername) : null;
  if (!user) {
    const error = new Error('INVALID_CREDENTIALS');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }
  if (!verifyPassword(password, user.passwordHash)) {
    const error = new Error('INVALID_CREDENTIALS');
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }
  return sanitizeUser(user);
}

function sanitizeUser(userRecord) {
  if (!userRecord) return null;
  return {
    id: userRecord.id,
    username: userRecord.username,
    createdAt: userRecord.createdAt,
  };
}

function createAuthSession(userId) {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  createSession({ tokenHash, userId, now });
  return token;
}

function resolveSession(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  const tokenHash = hashToken(token);
  const session = getSession(tokenHash);
  if (!session) {
    return null;
  }
  const user = getUserById(session.userId);
  if (!user) {
    deleteSession(tokenHash);
    return null;
  }
  touchSession(tokenHash, new Date().toISOString());
  return { user: sanitizeUser(user), tokenHash };
}

function revokeSession(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  deleteSession(tokenHash);
}

module.exports = {
  registerUser,
  loginUser,
  createAuthSession,
  resolveSession,
  revokeSession,
  hashPassword,
  verifyPassword,
};

