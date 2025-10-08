/**
 * Serveur Express illustrant le Long Polling pour suivre le statut d'une tâche.
 */
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "public")));

const STATUS_TIMEOUT_MS = 25000;

let currentStatus = {
    value: "En attente",
    version: 1,
    updatedAt: new Date().toISOString(),
};

const listeners = new Set();

function serializeStatus() {
    return {
        status: currentStatus.value,
        version: currentStatus.version,
        updatedAt: currentStatus.updatedAt,
    };
}

function notifyListeners() {
    const payload = serializeStatus();
    for (const listener of listeners) {
        try {
            listener.resolve(payload);
        } finally {
            listeners.delete(listener);
        }
    }
}

app.get("/poll-status", (req, res) => {
    const { lastVersion } = req.query;
    const parsedVersion = Number(lastVersion ?? 0);

    if (Number.isNaN(parsedVersion)) {
        return res.status(400).json({ error: "Paramètre 'lastVersion' invalide." });
    }

    if (parsedVersion < currentStatus.version) {
        return res.json(serializeStatus());
    }

    const timer = setTimeout(() => {
        listeners.delete(listener);
        res.status(204).end();
    }, STATUS_TIMEOUT_MS);

    const listener = {
        resolve: (payload) => {
            clearTimeout(timer);
            res.json(payload);
        },
    };

    listeners.add(listener);

    req.on("close", () => {
        clearTimeout(timer);
        listeners.delete(listener);
    });
});

app.post("/update-status", (req, res) => {
    const { status } = req.body;

    if (typeof status !== "string" || !status.trim()) {
        return res.status(400).json({ error: "Le champ 'status' est requis." });
    }

    currentStatus = {
        value: status.trim(),
        version: currentStatus.version + 1,
        updatedAt: new Date().toISOString(),
    };

    notifyListeners();

    return res.json(serializeStatus());
});

app.get("/current-status", (_req, res) => {
    res.json(serializeStatus());
});

app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`Long polling server listening on http://localhost:${PORT}`);
});
