Voici le sujet de votre TP, conçu pour être direct, pragmatique et tenir compte de l'utilisation des outils d'IA.

---

## TP : Communication Bidirectionnelle avec WebSockets Natifs

### Objectif du TP

Développer une application client-serveur utilisant des WebSockets natifs pour établir une communication bidirectionnelle. Ce TP vise à solidifier la compréhension des mécanismes fondamentaux des WebSockets sans l'abstraction de frameworks de haut niveau.

### Contexte et Prérequis

Les WebSockets sont un protocole de communication qui permet un échange de données bidirectionnel et en temps réel entre un client et un serveur sur une connexion persistante.

Pour ce TP, vous aurez besoin de :
*   Connaissances de base en JavaScript (ES6+).
*   Notions de base sur Node.js et `npm`.
*   Connaissances de base en HTML/CSS.
*   Un environnement Node.js installé sur votre machine.
*   Un éditeur de code (VS Code, Sublime Text, etc.).

**Note sur l'utilisation de l'IA :** Les outils d'intelligence artificielle (ChatGPT, Copilot, Bard, etc.) sont des assistants puissants. N'hésitez pas à les solliciter pour la syntaxe, la génération de code boilerplate, la compréhension d'erreurs, ou l'exploration de concepts. L'objectif est d'apprendre à les utiliser efficacement comme des outils de productivité, tout en s'assurant de comprendre le code généré et les principes sous-jacents.

### Énoncé du TP

Créer une application simple où un client envoie une chaîne de caractères à un serveur WebSocket. Le serveur reçoit cette chaîne, la capitalise (convertit en majuscules), puis la renvoie au client. Le client doit afficher la réponse du serveur.

### Architecture Proposée

*   **Serveur :** Node.js avec la bibliothèque `ws` (une implémentation de WebSocket simple et rapide).
*   **Client :** Une page HTML simple avec du JavaScript natif (API `WebSocket` du navigateur) pour interagir avec le serveur.

### Consignes Détaillées

#### 1. Initialisation du Projet

1.  Créez un dossier pour votre projet (ex: `tp-websocket-capitalizer`).
2.  Initialisez un projet Node.js :
    ```bash
    cd tp-websocket-capitalizer
    npm init -y
    ```
3.  Installez la bibliothèque `ws` pour le serveur :
    ```bash
    npm install ws
    ```

#### 2. Développement du Serveur WebSocket (`server.js`)

Créez un fichier `server.js` à la racine de votre projet. Ce fichier doit :

1.  Importer la classe `WebSocket.Server` de la bibliothèque `ws`.
2.  Créer une instance de `WebSocket.Server` sur un port de votre choix (par exemple, `8080`).
3.  Gérer l'événement `connection` :
    *   Lorsqu'un client se connecte, affichez un message dans la console du serveur (ex: "Nouveau client connecté").
    *   Pour chaque connexion client, gérez l'événement `message` :
        *   Recevez le message envoyé par le client.
        *   Assurez-vous que le message est une chaîne de caractères (les données WebSocket peuvent être binaires ou texte).
        *   Convertissez la chaîne reçue en majuscules.
        *   Renvoyez la chaîne capitalisée au client via la même connexion.
    *   Gérez l'événement `close` :
        *   Lorsqu'un client se déconnecte, affichez un message dans la console du serveur (ex: "Client déconnecté").
    *   Gérez l'événement `error` pour afficher les erreurs potentielles.
4.  Affichez un message dans la console indiquant que le serveur est démarré et écoute sur le port spécifié.

#### 3. Développement du Client WebSocket (`index.html` et `client.js`)

Créez un fichier `index.html` et un fichier `client.js` dans un sous-dossier `public` (ou à la racine, si vous préférez).

**`index.html` :**

1.  Créez une structure HTML simple :
    *   Un champ de texte (`<input type="text">`) pour que l'utilisateur puisse saisir sa chaîne.
    *   Un bouton (`<button>`) pour envoyer la chaîne au serveur.
    *   Un élément (`<div>` ou `<p>`) pour afficher la réponse du serveur.
2.  Liez votre fichier `client.js` à cette page (utilisez une balise `<script>` avec l'attribut `defer` ou placez-la juste avant la fermeture de `</body>`).

**`client.js` :**

1.  Récupérez les références aux éléments HTML (input, bouton, zone d'affichage).
2.  Créez une nouvelle instance de `WebSocket` en vous connectant à l'adresse de votre serveur (ex: `ws://localhost:8080`).
3.  Gérez l'événement `onopen` :
    *   Affichez un message dans la console du navigateur (ex: "Connecté au serveur WebSocket").
4.  Gérez l'événement `onmessage` :
    *   Recevez le message du serveur.
    *   Affichez ce message dans la zone d'affichage prévue dans `index.html`.
5.  Gérez l'événement `onclose` et `onerror` pour afficher des messages pertinents.
6.  Ajoutez un écouteur d'événement au bouton d'envoi :
    *   Lors du clic, récupérez la valeur du champ de texte.
    *   Envoyez cette valeur au serveur via l'instance `WebSocket`.
    *   Videz le champ de texte après l'envoi.

#### 4. Test et Validation

1.  Démarrez votre serveur Node.js :
    ```bash
    node server.js
    ```
2.  Ouvrez votre fichier `index.html` dans un navigateur web.
3.  Saisissez du texte dans le champ, cliquez sur le bouton et vérifiez que :
    *   Le serveur reçoit le message et le capitalise.
    *   Le client reçoit la version capitalisée et l'affiche correctement.
    *   Les messages de connexion/déconnexion s'affichent dans les consoles respectives (serveur et navigateur).

### Rendu

Votre rendu devra inclure :
*   Les fichiers `server.js`, `index.html` et `client.js`.
*   Un court fichier `README.md` expliquant comment lancer l'application.
*   Des commentaires clairs dans votre code pour expliquer les parties importantes.

### Critères d'Évaluation

*   **Fonctionnalité (60%) :** L'application fonctionne-t-elle comme décrit ? Le client envoie, le serveur capitalise et renvoie, le client affiche.
*   **Clarté et Organisation du Code (20%) :** Le code est-il lisible, bien structuré et commenté ?
*   **Gestion des Événements (10%) :** Les événements `connection`, `message`, `close` et `error` sont-ils correctement gérés côté serveur et client ?
*   **Utilisation de l'IA (10%) :** La capacité à utiliser l'IA comme un outil d'aide à la production et à la compréhension sera valorisée. N'hésitez pas à mentionner dans votre `README.md` comment l'IA vous a aidé sur certaines parties ou concepts.

---
Bon courage pour ce TP ! C'est une excellente occasion de manipuler les bases de la communication en temps réel.