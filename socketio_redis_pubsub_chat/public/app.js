const joinForm = document.querySelector("#join-form");
const usernameInput = document.querySelector("#username");
const chatSection = document.querySelector("#chat-section");
const currentUsernameLabel = document.querySelector("#current-username");
const messagesList = document.querySelector("#messages");
const messageForm = document.querySelector("#message-form");
const messageInput = document.querySelector("#message-input");
const connectionBadge = document.querySelector("#connection-status");
const participantsBadge = document.querySelector("#participants-count");

const socket = io({
    autoConnect: true,
});

const state = {
    username: null,
};

function setConnectionStatus(text, status) {
    connectionBadge.textContent = text;
    connectionBadge.dataset.state = status;
}

function updateParticipants(total) {
    const safeTotal = Number.isFinite(total) ? total : 0;
    participantsBadge.textContent = `Participants : ${safeTotal}`;
}

function formatTime(timestamp) {
    try {
        return new Date(timestamp ?? Date.now()).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    } catch {
        return "";
    }
}

function appendMessage(payload) {
    if (!payload || typeof payload.text !== "string") {
        return;
    }

    const li = document.createElement("li");
    const isSystem = payload.type === "system";
    const isSelf = !isSystem && payload.username === state.username;

    li.classList.add(isSystem ? "system" : "chat");
    if (isSelf) {
        li.classList.add("self");
    }

    const meta = document.createElement("div");
    meta.className = "meta";

    const time = formatTime(payload.timestamp);
    if (time) {
        const timeSpan = document.createElement("span");
        timeSpan.textContent = time;
        meta.append(timeSpan);
    }

    const authorSpan = document.createElement("span");
    authorSpan.textContent = isSystem ? (payload.username ?? "Système") : (payload.username ?? "Anonyme");
    meta.append(authorSpan);

    const content = document.createElement("div");
    content.className = "content";
    content.textContent = payload.text;

    li.append(meta, content);
    messagesList.append(li);
    messagesList.scrollTop = messagesList.scrollHeight;

    const MAX_MESSAGES = 250;
    while (messagesList.children.length > MAX_MESSAGES) {
        messagesList.removeChild(messagesList.firstChild);
    }
}

setConnectionStatus("Connexion en cours…", "connecting");

socket.on("connect", () => {
    setConnectionStatus("Connecté au serveur.", "connected");
    if (state.username) {
        socket.emit("register user", { username: state.username });
    }
});

socket.on("disconnect", () => {
    setConnectionStatus("Déconnecté du serveur.", "disconnected");
});

socket.io.on("reconnect_attempt", () => {
    setConnectionStatus("Tentative de reconnexion…", "reconnecting");
});

socket.on("connect_error", (error) => {
    console.error("Erreur de connexion :", error);
    setConnectionStatus("Erreur de connexion, nouvelle tentative…", "reconnecting");
});

socket.on("system message", (payload) => {
    appendMessage(payload);
});

socket.on("chat message", (payload) => {
    appendMessage(payload);
});

socket.on("participants", (payload) => {
    updateParticipants(payload?.total);
});

const joinButton = joinForm.querySelector("button");

joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    if (!username) {
        return;
    }

    socket.emit("register user", { username }, (response) => {
        if (!response?.ok) {
            window.alert(response?.message ?? "Impossible d'enregistrer ce pseudo.");
            return;
        }

        state.username = response.username;
        currentUsernameLabel.textContent = response.username;
        chatSection.classList.remove("hidden");
        messageInput.focus();
        if (joinButton) {
            joinButton.textContent = "Mettre à jour le pseudo";
        }
    });
});

messageForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = messageInput.value.trim();
    if (!text) {
        return;
    }

    socket.emit("chat message", { text }, (response) => {
        if (!response?.ok) {
            window.alert(response?.message ?? "Impossible d'envoyer ce message.");
            return;
        }
        messageInput.value = "";
        messageInput.focus();
    });
});
