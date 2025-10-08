# Long Polling Status App

Démo Express mettant en œuvre un mécanisme de Long Polling pour diffuser les changements d'état d'une tâche à plusieurs clients.

## Installation

```bash
npm install
```

## Lancement

```bash
npm run start
# ou: npm run dev (rechargement automatique avec Node --watch)
```

Ensuite ouvrez `http://localhost:4000` dans un ou plusieurs onglets de navigateur. Modifiez le statut via le formulaire, les autres onglets reçoivent la mise à jour immédiatement, sinon ils renouvellent la requête après 25 secondes.

## Points clés

- `GET /poll-status` garde la connexion ouverte jusqu'à 25 s et répond dès que la version change.
- `POST /update-status` simule un changement de statut côté serveur et notifie tous les clients en attente.
- `GET /current-status` fournit l'état initial pour tout nouveau client.
