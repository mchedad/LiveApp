# Exercice 8 – Persistance & Monitoring

Application temps réel permettant de partager une liste d’items synchronisée entre plusieurs onglets. Chaque mutation est persistée en SQLite, diffusée via Socket.IO et contrôlée par une authentification pseudo + mot de passe.

## Stack technique
- **Serveur** : Node.js 20, Express 5, Socket.IO 4, SQLite (via `better-sqlite3`).
- **Client** : HTML/CSS/JS natif, Socket.IO client.
- **Sécurité** : bcrypt pour les mots de passe, tokens de session hachés, validation stricte des payloads, rate limiting par utilisateur.
- **Monitoring** : métriques internes (connexions, événements/minute, latence moyenne) exposées via `/api/monitoring` + panneau UI.

## Architecture
```
client/               # UI (auth, liste, monitoring)
server/
  index.js            # Express + Socket.IO + routes REST
  lib/
    database.js       # Initialisation SQLite + fonctions CRUD
    auth.js           # Création/validation utilisateurs & sessions
    validators.js     # Sanitisation des entrées
    rateLimiter.js    # Limiteur token bucket par user
    monitoring.js     # Agrégation des métriques & logs
  data/app.db         # Base SQLite (générée au runtime)
answers.md            # Partie A théorique
README.md             # Ce fichier
```

Le serveur Express expose les API `/api/*`, sert les assets statiques (`client/*`) et monte Socket.IO sur le même port. Toutes les mutations passent soit par REST (fallback) soit par les événements Socket.IO `items:*`. Les données sont écrites dans `server/data/app.db` et rechargées à chaque connexion (`items:init`). Les métriques en mémoire sont partagées entre REST et Socket.IO.

## Fonctionnalités principales
- Authentification pseudo + mot de passe (inscription/login/logout) avec tokens de session hachés.
- Liste collaborative d’items (create/update/delete) synchronisée instantanément.
- Restrictions : un utilisateur ne peut modifier que ses propres items, 40 actions/min maximum (rate limiting).
- Résilience client : reconnexion automatique, file d’attente locale des actions hors ligne, mesure de latence ping/pong.
- Monitoring : compteur de connexions actives, événements/minute, latence moyenne, total items + journal circulaire affiché côté client.

## Plan de sécurité
1. **Validation & sanitisation** : pseudo normalisé (3-24 car.), contenu des items tronqué à 280 caractères et nettoyé des caractères exotiques. Le client n’injecte jamais d’HTML (usage de `textContent`).
2. **Contrôles d’accès** : middleware `requireAuth` pour toutes les routes sensibles, vérification que l’auteur de l’item correspond à l’utilisateur connecté avant update/delete.
3. **Rate limiting** : token bucket par user (`lib/rateLimiter.js`) partagé entre REST et Socket.IO pour limiter les abus.
4. **Sessions sécurisées** : tokens aléatoires hachés (HMAC SHA-256) avant stockage dans SQLite, possibilité de les révoquer sur logout.
5. **Headers** : Helmet actif (avec ajustements pour Socket.IO), CORS strict sur les mêmes origines par défaut.

## Monitoring & observabilité
- `/api/monitoring` retourne snapshot JSON : `activeConnections`, `eventsPerMinute`, `totalEvents`, `avgLatencyMs`, `lastSyncAt`, `logs[]`, `totalItems`.
- `lib/monitoring.js` maintient un journal circulaire (max 50 entrées) et calcule la moyenne glissante des latences reportées par les clients.
- Le front consomme périodiquement l’endpoint (toutes les 15s) et affiche les valeurs + dernières entrées dans le panneau “Logs de synchronisation”.

## Gestion des erreurs
- API REST : réponses JSON structurées (`{ error: "...", retryAfter? }`).
- Socket.IO : callbacks d’ack retournent `{ ok: false, error }` pour informer le client.
- Client : affichage des erreurs d’auth dans le panneau, notifications via `alert` pour les erreurs d’items, badge d’état de connexion.

## Mise en route
1. **Installer les dépendances serveur**
   ```bash
   cd exercice-8/server
   npm install
   cp .env.example .env   # optionnel, valeurs par défaut suffisantes
   ```
2. **Lancer le serveur**
   ```bash
   npm run dev
   ```
   Le serveur écoute sur `http://localhost:4700` et sert automatiquement l’interface.
3. **Ouvrir le client**  
   Naviguer sur `http://localhost:4700/` et ouvrir plusieurs onglets pour tester la synchro.

## Tests manuels recommandés
1. Inscription de deux utilisateurs dans deux onglets distincts, vérification de la liste d’utilisateurs connectés.
2. Création/édition/suppression d’items → la modification doit apparaître instantanément dans tous les onglets.
3. Vérifier que l’utilisateur B ne peut pas modifier/supprimer l’item de l’utilisateur A (message d’erreur).
4. Laisser un onglet hors ligne, créer des items, puis revenir en ligne : la file d’attente locale rejoue les actions.
5. Consulter le panneau Monitoring et l’endpoint raw via `curl http://localhost:4700/api/monitoring`.

## Améliorations possibles
- Support d’un CRDT simplifié pour la résolution de conflits multi-sources.
- Ajout de tests automatisés (ex : Vitest + supertest) pour les routes REST.
- Export Prometheus (`/metrics`) pour intégrer facilement Grafana.
- UI plus riche (édition inline, notifications toast) et internationalisation.
