# CollabBoard — Texte & Tableau collaboratifs

Application temps reel combinant editeur de texte et tableau blanc multi-utilisateurs, construite pour l'examen 6. Stack : Node.js + Express + Socket.IO (serveur) et client statique Vanilla JS.

## Fonctionnalites principales
- Authentification d'entree par pseudo + room + token partage (valide via middleware Socket.IO).
- Rooms dynamiques avec notifications `notification`, liste des participants en temps reel et indicateur `typing`.
- Synchronisation d'un tampon texte (`update`), throttle cote client et diffusion server-side vers tous les membres de la room.
- Tableau blanc collaboratif (canvas HTML5) avec couleur/epaisseur configurables, normalisation des points pour un rendu coherent et action `canvas:clear` securisee.
- Monitoring embarque : compteur de connexions, events/minute, rooms actives + endpoint JSON `/status` + logs `[monitoring]`.
- Mode UX dual/text/paint, overlay d'onboarding et gestion des erreurs de connexion (token invalide, reconnexion, etc.).
- Option bonus : adaptateur Redis activable via `REDIS_URL` pour synchroniser plusieurs instances.

## Structure
```
projet/
├── answers.md              # Reponses theoriques (Partie 1)
├── README.md               # Ce fichier
├── client/
│   ├── index.html          # UI statique (texte + canvas)
│   ├── styles.css
│   └── script.js
└── server/
    ├── index.js            # Serveur Express + Socket.IO
    ├── package.json
    └── .env.example
```

## Prerequis
- Node.js 18+ (testé avec Node 20). 
- npm 9+.
- (Optionnel) Redis 6+ si vous activez l'adaptateur multi-instances.

## Installation & lancement
1. Dupliquer la configuration :
   ```powershell
   cd C:\Users\cheda\Live-APP\projet\server
   copy .env.example .env
   ```
   - Ajuster `ALLOWED_TOKENS` pour definir vos cles; par defaut `COLLAB-12345,COLLAB-PAINT,COLLAB-TEAM`.
   - Renseigner `REDIS_URL` seulement si vous voulez le bonus.
2. Installer les dependances serveur :
   ```powershell
   npm install
   ```
3. Lancer en developpement avec rechargement :
   ```powershell
   npm run dev
   ```
4. Ouvrir le client : aller sur `http://localhost:4000/` (le serveur Express sert `client/`).
5. Renseigner un pseudo, une room (ex: `general`) et un token valide (`COLLAB-12345`). Rejoindre depuis 2 onglets pour tester la synchro.

Scripts disponibles :
- `npm run dev` : Nodemon.
- `npm start` : execution Node simple.
- `npm run lint` : verification syntaxique rapide (`node --check`).

## Evenements Socket.IO exposes
| Evenement          | Direction          | Description |
|--------------------|--------------------|-------------|
| `notification`     | Serveur → clients  | Arrivee/depart d'un utilisateur (texte UI). |
| `room:users`       | Serveur → clients  | Liste des pseudos de la room courante. |
| `workspace:init`   | Serveur → client   | Etat initial texte + strokes a la connexion. |
| `update`           | Client ↔ serveur   | Synchronisation du texte; serveur renvoie la version canonique. |
| `typing`           | Client ↔ serveur   | Indicateur “X ecrit…“. |
| `drawing`          | Client ↔ serveur   | Nouveau stroke normalise (tableau blanc). |
| `canvas:clear`     | Client ↔ serveur   | Reinitialisation du tableau blanc dans toute la room. |

## Monitoring & statut
- Logs console normalises : `[monitoring] ctx=<evenement> connections=<n> rooms=<n> events/min=<n>`.
- Endpoint `GET /status` retourne `activeConnections`, `eventsPerMinute` et la liste des rooms/occupations (utilise par le client toutes les 15s).
- Endpoint `GET /health` pour un ping rapide.

## Adaptateur Redis (bonus)
- Laisser `REDIS_URL` vide pour rester en mode stand-alone.
- Pour activer :
  ```env
  REDIS_URL=redis://localhost:6379
  ```
  Le serveur tente alors la connexion et loggue `Redis adapter enabled.`. En cas d'echec, l'app reste fonctionnelle sur une instance.

## Notes d'utilisation
- Le canvas normalise les points (0-1) afin que plusieurs clients avec des tailles d'ecran differentes rendent les memes tracés.
- Un buffer limite a 1000 strokes evite la saturation memoire. Ajustez `limitStrokeBuffer` et la tranche cote serveur si vous voulez un historique plus long.
- Token obligatoire : si vous partagez l'application publiquement, changez la valeur et, idealement, ajoutez une verification cote HTTP (formulaire) ou un vrai service d'auth.

## Aller plus loin
- Brancher une base (RedisJSON, Mongo) pour persister le contenu des rooms.
- Ajouter des outils canvas (gommes, formes) et un systeme de couches.
- Connecter Prometheus/Grafana en utilisant `/status` comme base.
- Internationaliser l'UI ou ajouter un panneau d'admin listant toutes les rooms actives.

Bon test !
