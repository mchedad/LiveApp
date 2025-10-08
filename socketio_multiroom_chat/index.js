/**
 * Chat multi-salons avec Socket.IO.
 */
const path = require("path");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const DEFAULT_ROOMS = ["Général", "Développement", "Support"];
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

function normalizeRoomName(value) {
    if (typeof value !== "string") {
        return "";
    }
    return value.trim().replace(/\s+/g, " ");
}

function roomsSnapshot() {
    return Array.from(rooms.entries()).map(([name, members]) => ({
        name,
        occupants: members.size,
    }));
}

function broadcastRoomsList() {
    io.emit("rooms list", roomsSnapshot());
}

function ensureRoomExists(roomName) {
    if (!rooms.has(roomName)) {
        rooms.set(roomName, new Map());
    }
}

function removeFromCurrentRoom(socket, { silent = false } = {}) {
    const currentRoom = socket.data.room;
    if (!currentRoom) {
        return;
    }

    const members = rooms.get(currentRoom);
    if (members) {
        members.delete(socket.id);
        if (members.size === 0) {
            rooms.delete(currentRoom);
        }
    }

    socket.leave(currentRoom);

    if (!silent && socket.data.username) {
        socket.to(currentRoom).emit("room message", {
            room: currentRoom,
            message: `${socket.data.username} a quitté le salon.`,
            timestamp: Date.now(),
        });
    }

    socket.data.room = undefined;
    broadcastRoomsList();
}

function handleJoinRoom(socket, username, roomName, callback) {
    const normalizedUsername = username.trim();
    const normalizedRoom = normalizeRoomName(roomName);

    if (!normalizedRoom) {
        if (typeof callback === "function") {
            callback({ ok: false, message: "Nom de salon invalide." });
        }
        return;
    }

    removeFromCurrentRoom(socket, { silent: true });

    ensureRoomExists(normalizedRoom);
    const members = rooms.get(normalizedRoom);
    members.set(socket.id, normalizedUsername);

    socket.data.username = normalizedUsername;
    socket.data.room = normalizedRoom;
    socket.join(normalizedRoom);

    socket.emit("room message", {
        room: normalizedRoom,
        message: `Vous avez rejoint le salon ${normalizedRoom}.`,
        timestamp: Date.now(),
    });

    socket.to(normalizedRoom).emit("room message", {
        room: normalizedRoom,
        message: `${normalizedUsername} a rejoint le salon.`,
        timestamp: Date.now(),
    });

    console.log(`${normalizedUsername} a rejoint ${normalizedRoom}`);
    broadcastRoomsList();

    if (typeof callback === "function") {
        callback({ ok: true, room: normalizedRoom });
    }
}

DEFAULT_ROOMS.forEach((roomName) => {
    rooms.set(roomName, new Map());
});

io.on("connection", (socket) => {
    console.log("Un utilisateur est connecté", socket.id);
    socket.emit("rooms list", roomsSnapshot());

    socket.on("create room", (payload, callback) => {
        const rawRoom = payload?.room ?? "";
        const normalizedRoom = normalizeRoomName(rawRoom);

        if (!normalizedRoom) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Veuillez saisir un nom de salon." });
            }
            return;
        }

        if (normalizedRoom.length > 40) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Le nom du salon doit contenir 40 caractères maximum." });
            }
            return;
        }

        if (rooms.has(normalizedRoom)) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Ce salon existe déjà." });
            }
            return;
        }

        rooms.set(normalizedRoom, new Map());
        console.log(`Salon créé: ${normalizedRoom}`);
        broadcastRoomsList();

        if (typeof callback === "function") {
            callback({ ok: true, room: normalizedRoom });
        }
    });

    socket.on("join room", (payload, callback) => {
        const { username, room } = payload ?? {};

        if (typeof username !== "string" || !username.trim()) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Pseudo requis." });
            }
            return;
        }

        if (typeof room !== "string" || !room.trim()) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Salon requis." });
            }
            return;
        }

        handleJoinRoom(socket, username, room, callback);
    });

    socket.on("chat message", (data) => {
        const message = typeof data === "string" ? data : data?.message;
        if (typeof message !== "string" || !message.trim()) {
            return;
        }

        const activeRoom = socket.data.room;
        const username = socket.data.username ?? "Anonyme";

        if (!activeRoom) {
            return;
        }

        const trimmedMessage = message.trim();

        io.to(activeRoom).emit("chat message", {
            username,
            room: activeRoom,
            message: trimmedMessage,
            timestamp: Date.now(),
        });
        console.log(`[${activeRoom}] ${username}: ${trimmedMessage}`);
    });

    socket.on("leave room", (callback) => {
        if (!socket.data.room) {
            if (typeof callback === "function") {
                callback({ ok: false, message: "Aucun salon à quitter." });
            }
            return;
        }
        const previousRoom = socket.data.room;
        removeFromCurrentRoom(socket);
        if (typeof callback === "function") {
            callback({ ok: true, room: previousRoom });
        }
    });

    socket.on("disconnect", () => {
        console.log("Un utilisateur est déconnecté", socket.id);
        if (socket.data.username && socket.data.room) {
            const { username, room } = socket.data;
            socket.to(room).emit("room message", {
                room,
                message: `${username} a quitté le salon.`,
                timestamp: Date.now(),
            });
            console.log(`${username} a quitté ${room}`);
        }
        removeFromCurrentRoom(socket, { silent: true });
    });
});

server.listen(PORT, () => {
    console.log(`Serveur Socket.IO en écoute sur http://localhost:${PORT}`);
    broadcastRoomsList();
});
