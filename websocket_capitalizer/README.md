# WebSocket Capitalizer

Application démontrant une communication bidirectionnelle via WebSockets : le client envoie une chaîne, le serveur renvoie la version en majuscules.

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Le serveur Express expose l'interface sur `http://localhost:8081` et attache un serveur WebSocket sur la même adresse (`ws://localhost:8081`). Ouvrez la page, envoyez quelques messages et observez les réponses capitalisées dans l'historique.

## Détails techniques

- Le client se connecte via l'API `WebSocket` native et affiche les messages dans une liste.
- Le serveur utilise `ws` pour écouter les connexions et renvoie un JSON `{ original, transformed, timestamp }`.
- Gestion complète des événements `open`, `message`, `close` et `error` pour faciliter le débogage.
