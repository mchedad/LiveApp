/**
 * Serveur WebSocket minimaliste : relaye les messages reçus à tous les clients connectés.
 */
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 8080;
const server = new WebSocketServer({ port: PORT });

function broadcast(payload, sender) {
    const message = JSON.stringify(payload);
    for (const client of server.clients) {
        if (client.readyState === client.OPEN && client !== sender) {
            client.send(message);
        }
    }
}

server.on("connection", (socket, request) => {
    const clientAddress = request.socket.remoteAddress;
    console.log(`Client connecté depuis ${clientAddress}`);

    socket.send(
        JSON.stringify({
            type: "system",
            content: "Bienvenue sur le chat WebSocket !",
            timestamp: Date.now(),
        })
    );

    socket.on("message", (data) => {
        let text = data.toString();
        if (!text.trim()) {
            return;
        }
        console.log(`Message reçu (${clientAddress}) :`, text);
        broadcast(
            {
                type: "chat",
                content: text,
                timestamp: Date.now(),
            },
            socket
        );
    });

    socket.on("close", () => {
        console.log(`Client déconnecté (${clientAddress})`);
    });

    socket.on("error", (error) => {
        console.error("Erreur WebSocket :", error);
    });
});

console.log(`Serveur WebSocket en écoute sur ws://localhost:${PORT}`);
