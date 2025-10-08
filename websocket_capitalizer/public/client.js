const form = document.querySelector("#message-form");
const input = document.querySelector("#message-input");
const status = document.querySelector("#status");
const history = document.querySelector("#history");

const websocketUrl = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
const socket = new WebSocket(websocketUrl);

function addHistoryEntry(original, transformed, timestamp) {
    const item = document.createElement("li");
    const date = new Date(timestamp);
    const formattedTime = date.toLocaleTimeString("fr-FR");
    item.innerHTML = `
        <span class="transformed">${transformed}</span>
        <span class="original">(${formattedTime}) Original : ${original}</span>
    `;
    history.prepend(item);
}

socket.addEventListener("open", () => {
    status.textContent = "Connecté au serveur WebSocket.";
});

socket.addEventListener("message", (event) => {
    try {
        const payload = JSON.parse(event.data);
        addHistoryEntry(payload.original, payload.transformed, payload.timestamp);
    } catch (error) {
        console.error("Message invalide:", error);
    }
});

socket.addEventListener("close", () => {
    status.textContent = "Connexion fermée.";
});

socket.addEventListener("error", (error) => {
    console.error("Erreur WebSocket:", error);
    status.textContent = "Erreur WebSocket détectée.";
});

form.addEventListener("submit", (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message || socket.readyState !== WebSocket.OPEN) {
        return;
    }
    socket.send(message);
    input.value = "";
    input.focus();
});
