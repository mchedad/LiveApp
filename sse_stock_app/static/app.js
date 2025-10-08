const { streamUrl } = window.APP_CONFIG;

const statusBadge = document.querySelector("#stream-status");
const toggleButton = document.querySelector("#toggle-stream");
const cards = new Map(
    Array.from(document.querySelectorAll(".stock-card")).map((card) => [
        card.dataset.symbol,
        {
            price: card.querySelector(".price"),
            change: card.querySelector(".change"),
            history: card.querySelector(".history"),
        },
    ])
);

let eventSource = null;

function setStatus(online) {
    statusBadge.classList.toggle("online", online);
    statusBadge.classList.toggle("offline", !online);
    statusBadge.textContent = online ? "Flux connecté" : "Flux déconnecté";
    toggleButton.textContent = online ? "Arrêter le flux" : "Démarrer le flux";
}

function updateCard(symbol, payload) {
    const elements = cards.get(symbol);
    if (!elements) {
        return;
    }

    elements.price.textContent = `${payload.price.toFixed(2)} €`;
    elements.change.textContent = `${payload.change.toFixed(2)} €`;
    elements.change.classList.remove("price-up", "price-down", "price-neutral");

    if (payload.change > 0.005) {
        elements.change.classList.add("price-up");
    } else if (payload.change < -0.005) {
        elements.change.classList.add("price-down");
    } else {
        elements.change.classList.add("price-neutral");
    }

    elements.history.innerHTML = "";
    payload.history.slice().reverse().forEach((value) => {
        const li = document.createElement("li");
        li.textContent = value.toFixed(2);
        elements.history.append(li);
    });
}

function startStream() {
    if (eventSource) {
        return;
    }
    eventSource = new EventSource(streamUrl);
    setStatus(true);

    eventSource.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            updateCard(payload.symbol, payload);
        } catch (error) {
            console.error("Erreur de parsing SSE :", error);
        }
    };

    eventSource.onerror = (error) => {
        console.error("Flux SSE interrompu :", error);
        stopStream(true);
    };
}

function stopStream(retry = false) {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
    setStatus(false);
    if (retry) {
        window.setTimeout(startStream, 3000);
    }
}

toggleButton.addEventListener("click", () => {
    if (eventSource) {
        stopStream(false);
    } else {
        startStream();
    }
});

// Lancement automatique au chargement.
startStream();
