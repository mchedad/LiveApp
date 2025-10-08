Bonjour !

Ce TP vous invite à explorer les fondations des communications en temps réel via les WebSockets. L'objectif est de construire une première brique fonctionnelle, un serveur et un client capables d'échanger des messages simples.

---

## TP : Connexion WebSocket Basique - Échange de Messages Simples

### Contexte

Les applications modernes exigent de plus en plus des interactions instantanées et bidirectionnelles entre le client et le serveur. Les requêtes HTTP traditionnelles, basées sur un modèle requête-réponse, ne sont pas toujours optimales pour ces scénarios. Les WebSockets offrent une solution élégante en établissant un canal de communication persistant et full-duplex sur une seule connexion TCP, permettant au serveur et au client d'envoyer des données à tout moment.

### Objectif du TP

Établir une connexion WebSocket basique pour permettre un échange de messages simple entre un serveur et un client.

### Prérequis

*   **Node.js** (avec npm) installé sur votre machine.
*   Un éditeur de code (VS Code, Sublime Text, etc.).
*   Un navigateur web moderne.
*   Connaissances de base en JavaScript et en utilisation de la ligne de commande.

### Enoncé du TP : Construire un Chat Minimaliste

Nous allons créer un serveur WebSocket et un client HTML/JavaScript qui pourront communiquer. Le serveur aura pour rôle de recevoir les messages des clients et de les retransmettre à tous les autres clients connectés (un "broadcast" simple).

---

### Partie 1 : Le Serveur WebSocket (Node.js)

Votre première tâche est de mettre en place un serveur capable d'accepter des connexions WebSocket et de gérer l'envoi/réception de messages.

1.  **Initialisation du projet :**
    *   Créez un nouveau dossier pour votre projet (ex: `tp-websocket-chat`).
    *   Ouvrez un terminal dans ce dossier et initialisez un projet Node.js :
        ```bash
        npm init -y
        ```
    *   Installez la bibliothèque `ws`, une implémentation populaire de WebSocket pour Node.js :
        ```bash
        npm install ws
        ```

2.  **Création du serveur :**
    *   Créez un fichier nommé `server.js` à la racine de votre projet.
    *   **Votre mission :** Demandez à l'IA de vous générer le code pour un serveur WebSocket simple en utilisant la bibliothèque `ws`.
        *   Le serveur devra écouter sur un port spécifique (par exemple, `8080`).
        *   À chaque nouvelle connexion d'un client, le serveur devra afficher un message dans la console (ex: "Nouveau client connecté").
        *   Lorsqu'un client envoie un message, le serveur devra le recevoir et l'afficher dans sa console.
        *   **Point clé :** Le serveur devra ensuite retransmettre ce message à *tous les autres clients connectés* (broadcast).

### Partie 2 : Le Client WebSocket (HTML/JavaScript)

Ensuite, vous allez créer une page web simple qui servira de client pour se connecter à votre serveur.

1.  **Création du client :**
    *   Créez un fichier nommé `client.html` à la racine de votre projet.
    *   **Votre mission :** Demandez à l'IA de vous générer le code HTML et JavaScript pour un client WebSocket.
        *   Le client devra se connecter à l'adresse de votre serveur WebSocket (ex: `ws://localhost:8080`).
        *   Il devra afficher un message dans la console du navigateur lorsque la connexion est établie.
        *   La page HTML devra contenir :
            *   Une zone de texte (`<textarea>` ou `<div>`) pour afficher les messages reçus.
            *   Un champ de saisie (`<input type="text">`) pour taper un message.
            *   Un bouton (`<button>`) pour envoyer le message.
        *   Lorsque le client reçoit un message du serveur, il devra l'ajouter à la zone d'affichage.
        *   Lorsque l'utilisateur clique sur le bouton "Envoyer", le message du champ de saisie devra être envoyé au serveur via la connexion WebSocket.

### Partie 3 : Test et Interaction

Il est temps de voir votre système en action !

1.  **Lancement du serveur :**
    *   Dans votre terminal, exécutez votre serveur :
        ```bash
        node server.js
        ```
    *   Vérifiez que le serveur démarre sans erreur et qu'il écoute sur le port configuré.

2.  **Lancement du client :**
    *   Ouvrez le fichier `client.html` dans votre navigateur web.
    *   Ouvrez les outils de développement de votre navigateur (F12) et regardez la console pour confirmer que la connexion WebSocket est établie.
    *   **Pour tester le broadcast :** Ouvrez `client.html` dans un deuxième onglet ou même un autre navigateur.

3.  **Interaction :**
    *   Dans l'un des clients, tapez un message et envoyez-le.
    *   Observez :
        *   Le message s'affiche-t-il dans la console du serveur ?
        *   Le message apparaît-il dans la zone d'affichage de *tous* les clients connectés ?
    *   Testez l'envoi de messages depuis différents clients.

---

### Consignes Générales et Utilisation de l'IA

*   **L'utilisation d'outils d'IA (ChatGPT, Copilot, etc.) est encouragée** pour vous aider dans la rédaction du code. C'est une compétence précieuse dans le monde professionnel actuel.
*   **Votre rôle est de comprendre, d'adapter et de valider le code généré.** Ne vous contentez pas de copier-coller. L'IA est un assistant, pas un remplaçant de votre réflexion.
*   **N'hésitez pas à poser des questions spécifiques à l'IA** sur des parties du code que vous ne comprenez pas (ex: "Explique-moi ce que fait `ws.on('message', ...)`").
*   **Soyez critique :** L'IA peut parfois faire des erreurs, proposer des solutions non optimales ou utiliser des syntaxes que vous n'avez pas encore vues. C'est l'occasion d'apprendre et de corriger.
*   **Expliquez vos choix :** Si vous modifiez le code généré par l'IA, soyez prêt à expliquer pourquoi.

### Livrables

Vous devrez soumettre :

1.  Les fichiers `server.js` et `client.html` que vous avez créés.
2.  Un court rapport (fichier `README.md` ou similaire) expliquant :
    *   Comment lancer votre serveur et votre client.
    *   Les principales étapes de votre implémentation.
    *   Les défis que vous avez rencontrés et comment vous les avez résolus (en mentionnant si l'IA vous a aidé et comment).
    *   Une capture d'écran montrant au moins deux clients échangeant des messages via votre chat minimaliste.

### Pour aller plus loin (Bonus)

Si vous avez terminé les tâches principales et souhaitez explorer davantage :

*   **Gestion des déconnexions :** Le serveur devrait afficher un message lorsqu'un client se déconnecte.
*   **Noms d'utilisateur :** Permettez aux clients de choisir un nom d'utilisateur et affichez-le avec chaque message (ex: `[NomUtilisateur] : Mon message`).
*   **Messages privés :** Implémentez une fonctionnalité pour envoyer des messages à un client spécifique plutôt qu'à tous.
*   **Amélioration de l'interface :** Utilisez un peu de CSS pour rendre le client plus agréable.

Bon courage dans cette exploration des WebSockets !