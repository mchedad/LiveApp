const statusValue = document.querySelector("#status-value");
const statusVersion = document.querySelector("#status-version");
const statusUpdated = document.querySelector("#status-updated");
const indicator = document.querySelector("#polling-indicator");
const form = document.querySelector("#update-form");
const input = document.querySelector("#new-status");

let lastVersion = 0;
let abortController = null;

function setIndicator(text, type = "idle") {
    indicator.textContent = text;
    indicator.dataset.state = type;
}

function formatDate(isoString) {
    try {
        return new Intl.DateTimeFormat("fr-FR", {
            dateStyle: "medium",
            timeStyle: "medium",
        }).format(new Date(isoString));
    } catch {
        return isoString;
    }
}

function renderStatus(payload) {
    statusValue.textContent = payload.status;
    statusVersion.textContent = payload.version;
    statusUpdated.textContent = formatDate(payload.updatedAt);
    lastVersion = payload.version;
}

async function pollStatus() {
    if (abortController) {
        abortController.abort();
    }
    abortController = new AbortController();
    const url = `/poll-status?lastVersion=${encodeURIComponent(lastVersion)}`;

    try {
        setIndicator("En attente d'un changement…", "waiting");
        const response = await fetch(url, {
            signal: abortController.signal,
            headers: {
                "Cache-Control": "no-cache",
            },
        });

        if (response.status === 204) {
            setIndicator("Aucun changement, nouvelle requête…", "idle");
            return pollStatus();
        }

        if (!response.ok) {
            throw new Error(`Erreur serveur ${response.status}`);
        }

        const data = await response.json();
        renderStatus(data);
        setIndicator("Changement reçu !", "received");
    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }
        console.error("Erreur de polling :", error);
        setIndicator("Erreur de connexion, nouvelle tentative dans 5s…", "error");
        setTimeout(pollStatus, 5000);
        return;
    }

    setTimeout(pollStatus, 0);
}

async function bootstrap() {
    try {
        const response = await fetch("/current-status", { headers: { "Cache-Control": "no-cache" } });
        if (!response.ok) {
            throw new Error("Impossible de récupérer le statut initial.");
        }
        const payload = await response.json();
        renderStatus(payload);
        setIndicator("Statut initial chargé.", "idle");
    } catch (error) {
        console.error(error);
        setIndicator("Impossible de récupérer le statut initial.", "error");
    }
    pollStatus();
}

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = input.value.trim();
    if (!status) {
        return;
    }

    try {
        setIndicator("Mise à jour du statut…", "updating");
        const response = await fetch("/update-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) {
            throw new Error(`Erreur serveur ${response.status}`);
        }
        input.value = "";
        const payload = await response.json();
        renderStatus(payload);
        setIndicator("Statut mis à jour.", "received");
    } catch (error) {
        console.error(error);
        setIndicator("Erreur lors de la mise à jour.", "error");
    }
});

bootstrap();
