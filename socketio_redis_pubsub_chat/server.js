/**
 * Serveur Socket.IO multi-instance synchronisé via Redis Pub/Sub.
 */
const path = require("path");
const http = require("http");
const express = require("express");
const morgan = require("morgan");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { randomUUID } = require("crypto");

require("dotenv").config();

const PORT = Number(process.env.PORT) || 4100;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

const app = express();
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/healthz", (_req, res) => {
    res.json({ status: "ok", redis: REDIS_URL });
});

const server = http.createServer(app);
const io = new Server(server, {
    connectionStateRecovery: true,
});

function generateId() {
    if (typeof randomUUID === "function") {
        return randomUUID();
    }
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
}

function createMessage({ type, text, username }) {
    return {
        id: generateId(),
        type,
        text,
        username,
        timestamp: new Date().toISOString(),
    };
}

async function broadcastParticipantCount() {
    try {
        const sockets = await io.fetchSockets();
        io.emit("participants", {
            total: sockets.length,
        });
    } catch (error) {
        console.error("Impossible de récupérer le nombre de participants :", error);
    }
}

io.on("connection", (socket) => {
    console.log("Nouvelle connexion", socket.id);
    socket.data.username = null;

    socket.emit(
        "system message",
        createMessage({
            type: "system",
            text: "Connexion établie avec le serveur de chat.",
            username: "Serveur",
        })
    );

    void broadcastParticipantCount();

    socket.on("register user", (payload, callback) => {
        const username = typeof payload?.username === "string" ? payload.username.trim() : "";

        if (!username) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Pseudo invalide." });
            }
            return;
        }

        const previousUsername = socket.data.username;
        socket.data.username = username;

        if (previousUsername && previousUsername !== username) {
            const info = createMessage({
                type: "system",
                text: `${previousUsername} utilise désormais le pseudo ${username}.`,
                username: "Serveur",
            });
            socket.emit("system message", info);
            socket.broadcast.emit("system message", info);
        } else if (!previousUsername) {
            const welcome = createMessage({
                type: "system",
                text: `Bienvenue ${username} !`,
                username: "Serveur",
            });
            socket.emit("system message", welcome);
            socket.broadcast.emit(
                "system message",
                createMessage({
                    type: "system",
                    text: `${username} a rejoint la conversation.`,
                    username: "Serveur",
                })
            );
        }

        if (typeof callback === "function") {
            callback({ ok: true, username });
        }

        void broadcastParticipantCount();
    });

    socket.on("chat message", (payload, callback) => {
        const text = typeof payload?.text === "string" ? payload.text.trim() : "";
        const username = socket.data.username;

        if (!username) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Enregistrez un pseudo avant d'envoyer un message." });
            }
            return;
        }

        if (!text) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Message vide." });
            }
            return;
        }

        const message = createMessage({
            type: "chat",
            text,
            username,
        });

        io.emit("chat message", message);

        if (typeof callback === "function") {
            callback({ ok: true });
        }
    });

    socket.on("disconnect", (reason) => {
        const username = socket.data.username;
        console.log(`Déconnexion ${socket.id} (${reason})`);

        if (username) {
            socket.broadcast.emit(
                "system message",
                createMessage({
                    type: "system",
                    text: `${username} a quitté la conversation.`,
                    username: "Serveur",
                })
            );
        }

        void broadcastParticipantCount();
    });
});

async function bootstrap() {
    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    pubClient.on("error", (error) => {
        console.error("Erreur Redis (publication) :", error);
    });

    subClient.on("error", (error) => {
        console.error("Erreur Redis (abonnement) :", error);
    });

    await Promise.all([pubClient.connect(), subClient.connect()]);
    io.adapter(createAdapter(pubClient, subClient));

    server.listen(PORT, () => {
        console.log(`Serveur Socket.IO Redis prêt sur http://localhost:${PORT}`);
        console.log(`Connexion Redis : ${REDIS_URL}`);
    });
}

bootstrap().catch((error) => {
    console.error("Impossible de démarrer le serveur :", error);
    process.exitCode = 1;
});
