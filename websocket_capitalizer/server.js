/**
 * Serveur Express + WebSocket transformant chaque message reçu en majuscules.
 */
const path = require("path");
const http = require("http");
const express = require("express");
const { WebSocketServer } = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8081;

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (socket, request) => {
    const clientAddress = request.socket.remoteAddress;
    console.log(`Client connecté (${clientAddress})`);

    socket.on("message", (data) => {
        const text = data.toString("utf-8");
        console.log(`Message reçu : ${text}`);
        const transformed = text.toUpperCase();
        socket.send(
            JSON.stringify({
                original: text,
                transformed,
                timestamp: Date.now(),
            })
        );
    });

    socket.on("close", () => {
        console.log(`Client déconnecté (${clientAddress})`);
    });

    socket.on("error", (error) => {
        console.error("Erreur WS :", error);
    });
});

server.listen(PORT, () => {
    console.log(`Serveur capitalizer disponible sur http://localhost:${PORT}`);
});
