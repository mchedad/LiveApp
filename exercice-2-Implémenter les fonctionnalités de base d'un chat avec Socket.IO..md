Bonjour ! Ce TP vous guidera dans l'implémentation d'une application de chat en temps réel, en mettant l'accent sur la gestion des salons (rooms) pour organiser les conversations.

---

## TP : Chat Multi-Salons avec Socket.IO

### Contexte & Objectif

Ce TP vise à implémenter les fonctionnalités de base d'un système de chat en temps réel utilisant Socket.IO. L'objectif est de permettre aux utilisateurs de rejoindre des salons spécifiques et d'échanger des messages visibles uniquement par les membres de ces salons.

### Prérequis

*   Connaissances de base en JavaScript (ES6).
*   Notions de base en HTML et CSS.
*   Environnement Node.js et npm installés.
*   Une compréhension générale du fonctionnement client-serveur.
*   Des notions de base sur Express et Socket.IO sont un plus, mais le TP est conçu pour vous les faire découvrir.

### Mise en place de l'environnement

1.  **Créez un nouveau dossier** pour votre projet et naviguez-y dans votre terminal :
    ```bash
    mkdir chat-multi-salons
    cd chat-multi-salons
    ```

2.  **Initialisez un projet Node.js** :
    ```bash
    npm init -y
    ```

3.  **Installez les dépendances nécessaires** :
    ```bash
    npm install express socket.io
    ```

4.  **Créez deux fichiers** à la racine de votre projet :
    *   `index.js` (pour le serveur)
    *   `index.html` (pour le client)

5.  **Contenu initial de `index.js`** (votre serveur) :
    ```javascript
    const express = require('express');
    const http = require('http');
    const { Server } = require('socket.io');
    const path = require('path');

    const app = express();
    const server = http.createServer(app);
    const io = new Server(server);

    // Servir le fichier index.html
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'index.html'));
    });

    // Écoute des connexions Socket.IO
    io.on('connection', (socket) => {
      console.log('Un utilisateur est connecté');

      socket.on('disconnect', () => {
        console.log('Un utilisateur est déconnecté');
      });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`Serveur en écoute sur le port ${PORT}`);
    });
    ```

6.  **Contenu initial de `index.html`** (votre client) :
    ```html
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Chat Multi-Salons</title>
        <style>
            body { font-family: sans-serif; margin: 0; padding: 20px; background-color: #f4f4f4; }
            #chat-container { max-width: 800px; margin: 20px auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            #messages { list-style-type: none; margin: 0; padding: 0; max-height: 400px; overflow-y: auto; border: 1px solid #eee; padding: 10px; margin-bottom: 10px; }
            #messages li { padding: 8px 10px; border-bottom: 1px solid #eee; }
            #messages li:last-child { border-bottom: none; }
            #messages li strong { color: #007bff; }
            #form-join, #form-chat { display: flex; margin-bottom: 10px; }
            #form-join input, #form-chat input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-right: 5px; }
            #form-join button, #form-chat button { padding: 10px 15px; background-color: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
            #form-join button:hover, #form-chat button:hover { background-color: #218838; }
            .hidden { display: none; }
        </style>
    </head>
    <body>
        <div id="chat-container">
            <h1>Chat Multi-Salons</h1>

            <div id="join-section">
                <form id="form-join">
                    <input id="username-input" autocomplete="off" placeholder="Votre pseudo" required />
                    <input id="room-input" autocomplete="off" placeholder="Nom du salon (ex: général, dev)" required />
                    <button type="submit">Rejoindre le salon</button>
                </form>
            </div>

            <div id="chat-section" class="hidden">
                <p>Vous êtes dans le salon : <strong id="current-room-display"></strong></p>
                <ul id="messages"></ul>
                <form id="form-chat">
                    <input id="message-input" autocomplete="off" placeholder="Votre message..." />
                    <button type="submit">Envoyer</button>
                </form>
            </div>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script>
            const socket = io();

            const joinSection = document.getElementById('join-section');
            const chatSection = document.getElementById('chat-section');
            const formJoin = document.getElementById('form-join');
            const usernameInput = document.getElementById('username-input');
            const roomInput = document.getElementById('room-input');
            const currentRoomDisplay = document.getElementById('current-room-display');

            const formChat = document.getElementById('form-chat');
            const messageInput = document.getElementById('message-input');
            const messages = document.getElementById('messages');

            let currentUsername = '';
            let currentRoom = '';

            // 1. Gérer la soumission du formulaire de connexion
            formJoin.addEventListener('submit', (e) => {
                e.preventDefault();
                if (usernameInput.value && roomInput.value) {
                    currentUsername = usernameInput.value;
                    currentRoom = roomInput.value;
                    currentRoomDisplay.textContent = currentRoom;

                    // TODO: Émettre un événement 'join room' vers le serveur
                    // avec le pseudo et le nom du salon.

                    joinSection.classList.add('hidden');
                    chatSection.classList.remove('hidden');
                }
            });

            // 2. Gérer la soumission du formulaire de chat
            formChat.addEventListener('submit', (e) => {
                e.preventDefault();
                if (messageInput.value) {
                    // TODO: Émettre un événement 'chat message' vers le serveur
                    // avec le message, le pseudo et le salon actuel.
                    messageInput.value = '';
                }
            });

            // 3. Écouter les messages entrants du serveur
            socket.on('chat message', (data) => {
                const item = document.createElement('li');
                item.innerHTML = `<strong>${data.username}</strong> (${data.room}) : ${data.message}`;
                messages.appendChild(item);
                messages.scrollTop = messages.scrollHeight; // Scroll automatique
            });

            // 4. Écouter les notifications de connexion/déconnexion dans le salon
            socket.on('room message', (data) => {
                const item = document.createElement('li');
                item.style.fontStyle = 'italic';
                item.style.color = '#666';
                item.textContent = data.message;
                messages.appendChild(item);
                messages.scrollTop = messages.scrollHeight;
            });

            socket.on('connect', () => {
                console.log('Connecté au serveur Socket.IO');
            });

            socket.on('disconnect', () => {
                console.log('Déconnecté du serveur Socket.IO');
            });
        </script>
    </body>
    </html>
    ```

7.  **Démarrez votre serveur** :
    ```bash
    node index.js
    ```
    Ouvrez votre navigateur à l'adresse `http://localhost:3000`.

---

### Exercices

Votre mission est de compléter le code pour que le chat fonctionne comme attendu.

#### Étape 1 : Rejoindre un Salon

**Objectif :** Permettre à un utilisateur de spécifier un pseudo et un nom de salon, puis de notifier le serveur de son intention de rejoindre ce salon.

1.  **Côté client (`index.html`) :**
    *   Dans l'écouteur d'événement `submit` du `formJoin`, après avoir défini `currentUsername` et `currentRoom`, émettez un événement Socket.IO vers le serveur.
    *   Cet événement devra s'appeler `join room` et transporter un objet contenant `username` et `room`.

    ```javascript
    // ... dans formJoin.addEventListener('submit', ...)
    socket.emit('join room', { username: currentUsername, room: currentRoom });
    // ...
    ```

2.  **Côté serveur (`index.js`) :**
    *   Dans le bloc `io.on('connection', (socket) => { ... });`, ajoutez un écouteur pour l'événement `join room`.
    *   Lorsque cet événement est reçu :
        *   Récupérez le `username` et le `room` envoyés par le client.
        *   Utilisez `socket.join(room)` pour ajouter le socket à ce salon.
        *   Stockez le `username` et le `room` directement sur l'objet `socket` (par exemple, `socket.data.username = username; socket.data.room = room;`). Cela sera utile pour les étapes suivantes.
        *   Émettez un message de notification à *tous les clients dans ce salon* (y compris le nouveau venu) pour annoncer que l'utilisateur a rejoint. Utilisez l'événement `room message` pour cela.

    ```javascript
    // ... dans io.on('connection', (socket) => { ... });
    socket.on('join room', (data) => {
      socket.join(data.room); // Ajoute le socket au salon
      socket.data.username = data.username; // Stocke le pseudo
      socket.data.room = data.room; // Stocke le salon actuel

      // Notifie tous les membres du salon (y compris le nouveau)
      io.to(data.room).emit('room message', { message: `${data.username} a rejoint le salon ${data.room}.` });
      console.log(`${data.username} a rejoint le salon ${data.room}`);
    });
    // ...
    ```

#### Étape 2 : Envoyer des Messages dans un Salon

**Objectif :** Permettre aux utilisateurs d'envoyer des messages qui ne sont visibles que par les membres du salon dans lequel ils se trouvent.

1.  **Côté client (`index.html`) :**
    *   Dans l'écouteur d'événement `submit` du `formChat`, après avoir vérifié `messageInput.value`, émettez un événement Socket.IO vers le serveur.
    *   Cet événement devra s'appeler `chat message` et transporter un objet contenant `username`, `room` (utilisez `currentUsername` et `currentRoom`) et `message` (le contenu de `messageInput.value`).

    ```javascript
    // ... dans formChat.addEventListener('submit', ...)
    socket.emit('chat message', {
        username: currentUsername,
        room: currentRoom,
        message: messageInput.value
    });
    // ...
    ```

2.  **Côté serveur (`index.js`) :**
    *   Dans le bloc `io.on('connection', (socket) => { ... });`, ajoutez un écouteur pour l'événement `chat message`.
    *   Lorsque cet événement est reçu :
        *   Récupérez le `username`, le `room` et le `message` envoyés par le client.
        *   Utilisez `io.to(room).emit('chat message', data)` pour émettre le message *uniquement aux clients qui sont dans ce salon spécifique*.
        *   Affichez le message dans la console du serveur pour le débogage.

    ```javascript
    // ... dans io.on('connection', (socket) => { ... });
    socket.on('chat message', (data) => {
      // Émet le message uniquement aux clients du salon spécifié
      io.to(data.room).emit('chat message', {
          username: data.username,
          room: data.room,
          message: data.message
      });
      console.log(`[${data.room}] ${data.username}: ${data.message}`);
    });
    // ...
    ```

#### Étape 3 : Gérer les Déconnexions

**Objectif :** Notifier les autres membres d'un salon lorsqu'un utilisateur le quitte (par déconnexion).

1.  **Côté serveur (`index.js`) :**
    *   Dans l'écouteur d'événement `disconnect` (déjà présent), vérifiez si le socket déconnecté avait un `username` et un `room` associés (grâce aux données stockées à l'étape 1).
    *   Si c'est le cas, émettez un message de notification à *tous les autres clients dans ce salon* (sauf celui qui se déconnecte, car il est déjà parti) pour annoncer que l'utilisateur a quitté. Utilisez l'événement `room message`.

    ```javascript
    // ... dans io.on('connection', (socket) => { ... });
    socket.on('disconnect', () => {
      console.log('Un utilisateur est déconnecté');
      if (socket.data.username && socket.data.room) {
        // Notifie les autres membres du salon que l'utilisateur est parti
        socket.to(socket.data.room).emit('room message', {
            message: `${socket.data.username} a quitté le salon ${socket.data.room}.`
        });
        console.log(`${socket.data.username} a quitté le salon ${socket.data.room}`);
      }
    });
    // ...
    ```

---

### Vérification et Test

1.  Redémarrez votre serveur (`Ctrl+C` puis `node index.js`).
2.  Ouvrez plusieurs onglets ou fenêtres de navigateur à l'adresse `http://localhost:3000`.
3.  Dans chaque onglet, entrez un pseudo différent et rejoignez des salons différents ou le même salon.
    *   Testez l'envoi de messages dans un salon : les messages ne devraient apparaître que dans les onglets ayant rejoint ce salon.
    *   Testez la déconnexion d'un onglet : un message devrait apparaître dans les autres onglets du même salon.

---

### Pistes d'amélioration (Optionnel)

*   **Liste des utilisateurs connectés** : Afficher la liste des utilisateurs présents dans le salon actuel.
*   **Changement de salon** : Permettre à un utilisateur de changer de salon sans recharger la page.
*   **Messages privés** : Implémenter la possibilité d'envoyer des messages directs à un utilisateur spécifique.
*   **Historique des messages** : Stocker les messages (en mémoire ou dans une base de données) et les charger lors de la connexion à un salon.
*   **Stylisation** : Améliorer l'interface utilisateur avec plus de CSS.

---

### Ressources Utiles

*   **Documentation officielle de Socket.IO** : [https://socket.io/docs/v4/](https://socket.io/docs/v4/) (C'est votre meilleure amie !)
*   **MDN Web Docs** : Pour tout ce qui concerne JavaScript, HTML, CSS.

---

### Conseils pour la Réussite

*   **Découpez le problème** : Abordez chaque étape séquentiellement. Ne passez pas à l'étape suivante tant que la précédente ne fonctionne pas.
*   **Testez régulièrement** : Après chaque modification significative, testez votre application.
*   **Utilisez la console** : Les `console.log()` côté serveur et client sont vos meilleurs outils de débogage.
*   **L'expérimentation est clé** : N'hésitez pas à essayer des choses, à consulter la documentation et à chercher des exemples. C'est en forgeant qu'on devient forgeron !

Bon courage !