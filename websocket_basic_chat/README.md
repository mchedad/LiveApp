# WebSocket Basic Chat

Chat temps réel ultra-simple en JavaScript utilisant la bibliothèque `ws` côté serveur et l'API WebSocket native côté client.

## Installation

```bash
npm install
```

## Lancement du serveur

```bash
npm start
```

Le serveur écoute par défaut sur `ws://localhost:8080`. Ouvrez `client.html` dans un ou plusieurs navigateurs, saisissez un message et observez le broadcast.

## Fonctionnement

- Le serveur reçoit les messages texte et les diffuse à tous les autres clients connectés.
- Chaque nouvel entrant reçoit un message système de bienvenue.
- Le client gère les événements `open`, `message`, `close` et `error` pour afficher l'état de la connexion.
