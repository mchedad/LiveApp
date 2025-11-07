const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'app.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const bootstrapSQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
`;

db.exec(bootstrapSQL);

function run(query, params = {}) {
  return db.prepare(query).run(params);
}

function get(query, params = {}) {
  return db.prepare(query).get(params);
}

function all(query, params = {}) {
  return db.prepare(query).all(params);
}

function createUser({ id, username, passwordHash, createdAt }) {
  run(
    `INSERT INTO users (id, username, password_hash, created_at)
     VALUES (@id, @username, @passwordHash, @createdAt)`,
    { id, username, passwordHash, createdAt }
  );
  return getUserById(id);
}

function getUserById(id) {
  return get(`SELECT id, username, password_hash as passwordHash, created_at as createdAt FROM users WHERE id = @id`, {
    id,
  });
}

function getUserByUsername(username) {
  return get(
    `SELECT id, username, password_hash as passwordHash, created_at as createdAt
     FROM users
     WHERE lower(username) = lower(@username)`,
    { username }
  );
}

function createSession({ tokenHash, userId, now }) {
  run(
    `INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at)
     VALUES (@tokenHash, @userId, @now, @now)
     ON CONFLICT(token_hash) DO UPDATE SET last_seen_at = excluded.last_seen_at`,
    { tokenHash, userId, now }
  );
  return { tokenHash, userId, createdAt: now, lastSeenAt: now };
}

function touchSession(tokenHash, now) {
  run(`UPDATE sessions SET last_seen_at = @now WHERE token_hash = @tokenHash`, { now, tokenHash });
}

function getSession(tokenHash) {
  return get(`SELECT token_hash as tokenHash, user_id as userId, created_at as createdAt, last_seen_at as lastSeenAt FROM sessions WHERE token_hash = @tokenHash`, {
    tokenHash,
  });
}

function deleteSession(tokenHash) {
  run(`DELETE FROM sessions WHERE token_hash = @tokenHash`, { tokenHash });
}

function insertItem({ id, content, ownerId, ownerName, now }) {
  run(
    `INSERT INTO items (id, content, owner_id, owner_name, version, created_at, updated_at)
     VALUES (@id, @content, @ownerId, @ownerName, 1, @now, @now)`,
    { id, content, ownerId, ownerName, now }
  );
  return getItemById(id);
}

function updateItem({ id, content, ownerId, now }) {
  const result = get(`SELECT * FROM items WHERE id = @id`, { id });
  if (!result) {
    return null;
  }
  if (result.owner_id !== ownerId) {
    const error = new Error('FORBIDDEN_ITEM_OWNER');
    error.code = 'FORBIDDEN_ITEM_OWNER';
    throw error;
  }
  run(
    `UPDATE items
     SET content = @content,
         version = version + 1,
         updated_at = @now
     WHERE id = @id`,
    { content, now, id }
  );
  return getItemById(id);
}

function deleteItem({ id, ownerId }) {
  const result = get(`SELECT * FROM items WHERE id = @id`, { id });
  if (!result) {
    return null;
  }
  if (result.owner_id !== ownerId) {
    const error = new Error('FORBIDDEN_ITEM_OWNER');
    error.code = 'FORBIDDEN_ITEM_OWNER';
    throw error;
  }
  run(`DELETE FROM items WHERE id = @id`, { id });
  return {
    id,
    deleted: true,
  };
}

function getItemById(id) {
  return get(
    `SELECT id, content, owner_id as ownerId, owner_name as ownerName, version, created_at as createdAt, updated_at as updatedAt
     FROM items
     WHERE id = @id`,
    { id }
  );
}

function listItems() {
  return all(
    `SELECT id, content, owner_id as ownerId, owner_name as ownerName, version, created_at as createdAt, updated_at as updatedAt
     FROM items
     ORDER BY created_at ASC`
  );
}

function countItems() {
  const row = get(`SELECT COUNT(*) as total FROM items`);
  return row?.total ?? 0;
}

module.exports = {
  db,
  createUser,
  getUserByUsername,
  getUserById,
  createSession,
  touchSession,
  getSession,
  deleteSession,
  insertItem,
  updateItem,
  deleteItem,
  getItemById,
  listItems,
  countItems,
};

