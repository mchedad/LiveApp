/**
 * Application collaborative sécurisée avec Express, Socket.IO, JWT et contrôles d'accès.
 */
const path = require("path");
const http = require("http");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Server } = require("socket.io");

require("dotenv").config();

const PORT = Number(process.env.PORT) || 4300;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || "2h";

const app = express();
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

/**
 * --- Stockage en mémoire ---
 * Dans un contexte réel on utiliserait une base de données.
 */
const users = [];
const notes = [];

function sanitizeUser(user) {
    return {
        id: user.id,
        username: user.username,
        createdAt: user.createdAt,
    };
}

function generateId() {
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

function verifyPassword(password, hash) {
    return bcrypt.compareSync(password, hash);
}

function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

function findUserByUsername(username) {
    return users.find((user) => user.username.toLowerCase() === username.toLowerCase());
}

function loadInitialData() {
    if (users.length === 0) {
        const defaultUser = {
            id: generateId(),
            username: "demo",
            passwordHash: hashPassword("demo123"),
            createdAt: new Date().toISOString(),
        };
        users.push(defaultUser);
    }

    if (notes.length === 0) {
        const author = users[0];
        notes.push({
            id: generateId(),
            content: "Bienvenue sur le tableau sécurisé !",
            authorId: author.id,
            authorName: author.username,
            updatedAt: new Date().toISOString(),
        });
    }
}

function broadcastNotes() {
    io.emit("notes:update", notes);
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: "Token manquant." });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find((candidate) => candidate.id === decoded.sub);
        if (!user) {
            return res.status(401).json({ error: "Utilisateur invalide." });
        }
        req.user = user;
        return next();
    } catch (error) {
        return res.status(401).json({ error: "Token invalide ou expiré." });
    }
}

app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", notes: notes.length, users: users.length });
});

app.post("/register", (req, res) => {
    const { username, password } = req.body ?? {};

    if (typeof username !== "string" || username.trim().length < 3) {
        return res.status(400).json({ error: "Le pseudo doit contenir au moins 3 caractères." });
    }

    if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Le mot de passe doit contenir au moins 6 caractères." });
    }

    if (findUserByUsername(username)) {
        return res.status(409).json({ error: "Ce pseudo est déjà utilisé." });
    }

    const user = {
        id: generateId(),
        username: username.trim(),
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    };
    users.push(user);

    const token = createToken({ sub: user.id, username: user.username });

    return res.status(201).json({
        user: sanitizeUser(user),
        token,
    });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body ?? {};

    if (typeof username !== "string" || typeof password !== "string") {
        return res.status(400).json({ error: "Identifiants invalides." });
    }

    const user = findUserByUsername(username);
    if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Pseudo ou mot de passe incorrect." });
    }

    const token = createToken({ sub: user.id, username: user.username });

    return res.json({
        user: sanitizeUser(user),
        token,
    });
});

app.get("/session", requireAuth, (req, res) => {
    return res.json({ user: sanitizeUser(req.user) });
});

app.get("/notes", (_req, res) => {
    res.json({ notes });
});

app.post("/notes", requireAuth, (req, res) => {
    const { content } = req.body ?? {};

    if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Le contenu est requis." });
    }

    const note = {
        id: generateId(),
        content: content.trim(),
        authorId: req.user.id,
        authorName: req.user.username,
        updatedAt: new Date().toISOString(),
    };
    notes.push(note);
    broadcastNotes();
    return res.status(201).json({ note });
});

app.put("/notes/:id", requireAuth, (req, res) => {
    const { content } = req.body ?? {};
    const note = notes.find((item) => item.id === req.params.id);

    if (!note) {
        return res.status(404).json({ error: "Note introuvable." });
    }

    if (note.authorId !== req.user.id) {
        return res.status(403).json({ error: "Vous ne pouvez modifier que vos propres notes." });
    }

    if (typeof content !== "string" || !content.trim()) {
        return res.status(400).json({ error: "Le contenu est requis." });
    }

    note.content = content.trim();
    note.updatedAt = new Date().toISOString();
    broadcastNotes();
    return res.json({ note });
});

app.delete("/notes/:id", requireAuth, (req, res) => {
    const index = notes.findIndex((item) => item.id === req.params.id);
    if (index === -1) {
        return res.status(404).json({ error: "Note introuvable." });
    }

    if (notes[index].authorId !== req.user.id) {
        return res.status(403).json({ error: "Vous ne pouvez supprimer que vos propres notes." });
    }

    const [deleted] = notes.splice(index, 1);
    broadcastNotes();
    return res.json({ note: deleted });
});

io.use((socket, next) => {
    const { token } = socket.handshake.auth ?? {};
    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = users.find((candidate) => candidate.id === decoded.sub);
        if (user) {
            socket.data.user = sanitizeUser(user);
        }
    } catch (error) {
        console.warn("Connexion Socket.IO avec token invalide :", error.message);
    }
    return next();
});

io.on("connection", (socket) => {
    console.log("Client connecté", socket.id, socket.data.user ? `(user: ${socket.data.user.username})` : "");
    socket.emit("notes:init", notes);

    socket.on("disconnect", (reason) => {
        console.log(`Client déconnecté ${socket.id} (${reason})`);
    });
});

loadInitialData();
broadcastNotes();

server.listen(PORT, () => {
    console.log(`Serveur sécurisé démarré sur http://localhost:${PORT}`);
});
