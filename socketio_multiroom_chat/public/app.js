const socket = io();

const joinForm = document.querySelector("#join-form");
const usernameInput = document.querySelector("#username");
const roomInput = document.querySelector("#room");
const joinSection = document.querySelector("#join-section");

const chatSection = document.querySelector("#chat-section");
const messagesList = document.querySelector("#messages");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const currentUsernameDisplay = document.querySelector("#current-username");
const currentRoomDisplay = document.querySelector("#current-room");

const roomsList = document.querySelector("#rooms-list");
const createRoomForm = document.querySelector("#create-room-form");
const newRoomInput = document.querySelector("#new-room-name");
const roomsFeedback = document.querySelector("#rooms-feedback");

const state = {
    username: null,
    room: null,
    pendingRoom: null,
};

let knownRooms = [];

function setRoomsFeedback(message, tone = "info") {
    roomsFeedback.textContent = message ?? "";
    roomsFeedback.dataset.state = message ? tone : "";
}

function formatTimestamp(ts) {
    try {
        return new Date(ts ?? Date.now()).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return "";
    }
}

function addMessage({ type = "chat", username, room, message, timestamp }) {
    if (room && state.room && room !== state.room && room !== state.pendingRoom) {
        return;
    }

    const li = document.createElement("li");
    li.classList.add(type === "system" ? "system" : "chat");

    const meta = document.createElement("div");
    meta.className = "meta";

    const timeLabel = formatTimestamp(timestamp);
    if (type === "system") {
        meta.textContent = timeLabel ? `[${timeLabel}] ${room ?? "Info"}` : room ?? "Info";
    } else {
        const author = username ?? "Anonyme";
        const roomLabel = room ?? state.room ?? "";
        meta.textContent = `[${timeLabel}] ${author} · ${roomLabel}`.trim();
    }

    const content = document.createElement("div");
    content.className = "content";
    content.textContent = message;

    li.append(meta, content);
    messagesList.append(li);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function renderRooms(rooms) {
    knownRooms = rooms;
    roomsList.innerHTML = "";

    if (!rooms.length) {
        const placeholder = document.createElement("li");
        placeholder.className = "placeholder";
        placeholder.textContent = "Aucun salon disponible pour le moment.";
        roomsList.append(placeholder);
        return;
    }

    rooms.forEach(({ name, occupants }) => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.room = name;
        const isActive = state.room === name || state.pendingRoom === name;
        if (isActive) {
            button.classList.add("active");
        }

        const countLabel = `${occupants} connecté${occupants > 1 ? "s" : ""}`;
        button.innerHTML = `<span class="name">${name}</span><span class="count">${countLabel}</span>`;

        li.append(button);
        roomsList.append(li);
    });
}

function highlightActiveRoom() {
    renderRooms(knownRooms);
}

function showChatSection() {
    joinSection.classList.add("hidden");
    chatSection.classList.remove("hidden");
    messageInput.focus();
}

function clearMessages() {
    messagesList.innerHTML = "";
}

function joinRoom(targetRoom) {
    if (!state.username) {
        roomInput.value = targetRoom;
        roomInput.focus();
        setRoomsFeedback("Choisissez d'abord un pseudo puis cliquez sur Rejoindre.", "info");
        return;
    }

    if (state.room === targetRoom) {
        setRoomsFeedback(`Vous êtes déjà dans le salon ${targetRoom}.`, "info");
        return;
    }

    state.pendingRoom = targetRoom;
    highlightActiveRoom();
    socket.emit("join room", { username: state.username, room: targetRoom }, (response) => {
        if (!response?.ok) {
            state.pendingRoom = null;
            highlightActiveRoom();
            setRoomsFeedback(response?.message ?? "Impossible de rejoindre ce salon.", "error");
            return;
        }

        state.room = response.room;
        state.pendingRoom = null;
        currentRoomDisplay.textContent = response.room;
        highlightActiveRoom();
        clearMessages();
        setRoomsFeedback("", "info");
        showChatSection();
    });
}

joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const room = roomInput.value.trim();
    if (!username || !room) {
        return;
    }

    state.username = username;
    currentUsernameDisplay.textContent = username;
    setRoomsFeedback("", "info");
    joinRoom(room);
});

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!state.username || !state.room) {
        setRoomsFeedback("Sélectionnez un salon avant d'envoyer un message.", "error");
        return;
    }
    const message = messageInput.value.trim();
    if (!message) {
        return;
    }
    socket.emit("chat message", { message });
    addMessage({
        type: "chat",
        username: state.username,
        room: state.room,
        message,
        timestamp: Date.now(),
    });
    messageInput.value = "";
});

roomsList.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-room]");
    if (!button) {
        return;
    }
    const targetRoom = button.dataset.room;
    joinRoom(targetRoom);
});

createRoomForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const roomName = newRoomInput.value.trim();
    if (!roomName) {
        return;
    }

    socket.emit("create room", { room: roomName }, (response) => {
        if (!response?.ok) {
            setRoomsFeedback(response?.message ?? "Impossible de créer ce salon.", "error");
            return;
        }

        newRoomInput.value = "";
        setRoomsFeedback(`Salon "${response.room}" créé.`, "success");

        if (state.username) {
            joinRoom(response.room);
        } else {
            roomInput.value = response.room;
            roomInput.focus();
        }
    });
});

socket.on("rooms list", (rooms) => {
    renderRooms(rooms);
});

socket.on("chat message", (payload) => {
    if (payload.username === state.username && payload.room === state.room) {
        return;
    }
    addMessage({
        type: "chat",
        ...payload,
    });
});

socket.on("room message", (payload) => {
    addMessage({
        type: "system",
        ...payload,
    });
});

socket.on("connect", () => {
    console.log("Connecté au serveur Socket.IO");
});

socket.on("disconnect", () => {
    addMessage({ type: "system", message: "Déconnecté du serveur." });
});
