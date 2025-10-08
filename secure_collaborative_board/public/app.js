const authPanel = document.querySelector("#auth-panel");
const dashboard = document.querySelector("#dashboard");
const currentUserLabel = document.querySelector("#current-user");
const logoutButton = document.querySelector("#logout-button");
const noteForm = document.querySelector("#note-form");
const noteContentInput = document.querySelector("#note-content");
const notesList = document.querySelector("#notes-list");
const notesCount = document.querySelector("#notes-count");
const loginForm = document.querySelector("#login-form");
const registerForm = document.querySelector("#register-form");
const noteTemplate = document.querySelector("#note-template");

const state = {
    token: null,
    user: null,
    notes: [],
};

const socket = io({
    autoConnect: false,
});

function loadSession() {
    try {
        const raw = window.localStorage.getItem("secure-board-session");
        if (!raw) {
            return;
        }
        const session = JSON.parse(raw);
        if (session?.token && session?.user) {
            state.token = session.token;
            state.user = session.user;
        }
    } catch (error) {
        console.warn("Session invalide :", error);
    }
}

function saveSession() {
    if (!state.token || !state.user) {
        window.localStorage.removeItem("secure-board-session");
        return;
    }
    window.localStorage.setItem(
        "secure-board-session",
        JSON.stringify({ token: state.token, user: state.user })
    );
}

function clearSession() {
    state.token = null;
    state.user = null;
    saveSession();
    renderAuthState();
    reconnectSocket();
}

function renderAuthState() {
    const isAuthenticated = Boolean(state.user && state.token);
    if (isAuthenticated) {
        authPanel.classList.add("hidden");
        dashboard.classList.remove("hidden");
        currentUserLabel.textContent = state.user.username;
    } else {
        authPanel.classList.remove("hidden");
        dashboard.classList.add("hidden");
        currentUserLabel.textContent = "?";
        noteContentInput.value = "";
    }
    renderNotes();
}

function formatTimestamp(isoString) {
    try {
        return new Date(isoString).toLocaleString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
        });
    } catch {
        return isoString;
    }
}

function renderNotes() {
    notesList.innerHTML = "";

    notesCount.textContent = `${state.notes.length} ${state.notes.length > 1 ? "notes" : "note"}`;

    if (!state.notes.length) {
        const empty = document.createElement("li");
        empty.className = "note";
        empty.innerHTML = "<em>Aucune note pour le moment.</em>";
        notesList.append(empty);
        return;
    }

    const fragment = document.createDocumentFragment();

    state.notes
        .slice()
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .forEach((note) => {
            const clone = noteTemplate.content.cloneNode(true);
            const root = clone.querySelector(".note");
            const content = clone.querySelector(".note-content");
            const meta = clone.querySelector(".meta");
            const actions = clone.querySelector(".actions");

            content.textContent = note.content;
            meta.textContent = `par ${note.authorName ?? "Inconnu"} • ${formatTimestamp(note.updatedAt)}`;
            root.dataset.id = note.id;

            const isOwner = state.user?.id === note.authorId;
            if (!isOwner) {
                root.classList.add("readonly");
            } else {
                actions.dataset.noteId = note.id;
            }

            fragment.append(clone);
        });

    notesList.append(fragment);
}

async function apiRequest(path, options = {}) {
    const response = await fetch(path, {
        method: options.method ?? "GET",
        headers: {
            "Content-Type": "application/json",
            ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
            ...(options.headers ?? {}),
        },
        body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
        let message = `Erreur ${response.status}`;
        try {
            const payload = await response.json();
            message = payload.error ?? message;
        } catch {
            // ignore
        }
        throw new Error(message);
    }

    if (response.status === 204) {
        return null;
    }
    return response.json();
}

async function fetchNotes() {
    try {
        const data = await apiRequest("/notes");
        state.notes = Array.isArray(data?.notes) ? data.notes : [];
        renderNotes();
    } catch (error) {
        console.error("Impossible de récupérer les notes :", error);
    }
}

function handleAuthSuccess(payload) {
    state.token = payload.token;
    state.user = payload.user;
    saveSession();
    renderAuthState();
    reconnectSocket();
}

function reconnectSocket() {
    socket.auth = state.token ? { token: state.token } : {};
    if (socket.connected) {
        socket.disconnect();
    }
    socket.connect();
}

socket.on("connect", () => {
    console.log("Connecté au flux temps réel");
});

socket.on("disconnect", (reason) => {
    console.log("Déconnecté du flux temps réel :", reason);
});

socket.on("notes:init", (notes) => {
    state.notes = Array.isArray(notes) ? notes : [];
    renderNotes();
});

socket.on("notes:update", (notes) => {
    state.notes = Array.isArray(notes) ? notes : [];
    renderNotes();
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const payload = {
        username: formData.get("username")?.trim(),
        password: formData.get("password"),
    };

    try {
        const data = await apiRequest("/login", { method: "POST", body: payload });
        handleAuthSuccess(data);
        loginForm.reset();
    } catch (error) {
        window.alert(error.message);
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const payload = {
        username: formData.get("username")?.trim(),
        password: formData.get("password"),
    };

    try {
        const data = await apiRequest("/register", { method: "POST", body: payload });
        handleAuthSuccess(data);
        registerForm.reset();
    } catch (error) {
        window.alert(error.message);
    }
});

logoutButton.addEventListener("click", () => {
    clearSession();
});

noteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = noteContentInput.value.trim();
    if (!content) {
        return;
    }

    try {
        await apiRequest("/notes", { method: "POST", body: { content } });
        noteForm.reset();
    } catch (error) {
        window.alert(error.message);
    }
});

notesList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
        return;
    }

    const action = button.dataset.action;
    const noteElement = button.closest(".note");
    const noteId = noteElement?.dataset.id;
    if (!noteId) {
        return;
    }

    if (action === "edit") {
        const existing = state.notes.find((note) => note.id === noteId);
        if (!existing) {
            return;
        }
        const nextContent = window.prompt("Modifier la note :", existing.content);
        if (nextContent === null) {
            return;
        }
        try {
            await apiRequest(`/notes/${noteId}`, { method: "PUT", body: { content: nextContent } });
        } catch (error) {
            window.alert(error.message);
        }
    } else if (action === "delete") {
        if (!window.confirm("Supprimer cette note ?")) {
            return;
        }
        try {
            await apiRequest(`/notes/${noteId}`, { method: "DELETE" });
        } catch (error) {
            window.alert(error.message);
        }
    }
});

loadSession();
renderAuthState();
reconnectSocket();
fetchNotes();
