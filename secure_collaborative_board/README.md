# Secure Collaborative Board

Tableau de notes collaboratif temps réel sécurisant les actions d'écriture par authentification JWT et contrôle d'autorisation. Les utilisateurs peuvent consulter toutes les notes mais ne peuvent créer / modifier / supprimer que les leurs. Les mises à jour sont diffusées instantanément via Socket.IO.

## Prérequis

- Node.js 18+ et npm.
- Aucun service externe nécessaire (stockage en mémoire). Optionnellement, créez un fichier `.env` pour personnaliser le port ou la clé JWT.

## Installation

```bash
npm install
```

Copiez ensuite le fichier `.env.example` si vous souhaitez personnaliser l'environnement :

```bash
cp .env.example .env
# puis modifiez PORT et JWT_SECRET si besoin
```

Valeurs par défaut :

- `PORT=4300`
- `JWT_SECRET=dev-secret-change-me`
- `JWT_EXPIRES_IN=2h`

> ⚠️ Changez la clé `JWT_SECRET` pour toute utilisation autre que locale.

## Lancement

```bash
npm start
# ou pour rechargement automatique :
npm run dev
```

Ouvrez `http://localhost:4300`. Un compte de démonstration (`demo` / `demo123`) et une note d'accueil sont créés automatiquement.

## Fonctionnalités majeures

- **Authentification JWT** : inscription et connexion (`POST /register`, `POST /login`). Les mots de passe sont hachés (`bcryptjs`) et le token est stocké côté client.
- **Contrôle d'accès** : middleware qui protège les routes d'écriture (`POST`, `PUT`, `DELETE /notes`) et vérifie la propriété (`authorId === userId`). Les requêtes non authentifiées restent en lecture seule.
- **Temps réel** : Socket.IO diffuse `notes:update` à chaque changement ; les clients se mettent à jour sans rechargement. Le token est transmis (optionnel) lors de la connexion pour associer l'utilisateur à la socket.
- **Frontend vanilla** : formulaire d'inscription/connexion, composition de notes, boutons d'édition/suppression affichés uniquement pour l'auteur, compteur dynamique. Gestion de session via `localStorage`.

## API & Flux temps réel

| Méthode | Route            | Auth | Description                                       |
|---------|------------------|------|---------------------------------------------------|
| GET     | `/healthz`       | Non  | État simple du service                            |
| POST    | `/register`      | Non  | Inscription + retour du token                     |
| POST    | `/login`         | Non  | Connexion + retour du token                       |
| GET     | `/session`       | Oui  | Récupération du profil connecté                   |
| GET     | `/notes`         | Non  | Liste complète des notes                          |
| POST    | `/notes`         | Oui  | Création d'une note (auteur = utilisateur JWT)    |
| PUT     | `/notes/:id`     | Oui  | Mise à jour si l'auteur correspond                |
| DELETE  | `/notes/:id`     | Oui  | Suppression si l'auteur correspond                |

Socket.IO émet :

- `notes:init` : envoyé à la connexion initiale (liste complète).
- `notes:update` : broadcast à chaque changement (`POST/PUT/DELETE`).

Les clients peuvent transmettre `auth.token` lors de la connexion Socket.IO pour authentifier la session côté websocket (utilisé ici pour logger l'identité, extensible pour autoriser des événements privés).

## Scénarios de tests recommandés

1. **Lecture seule** : Ouvrez l'application sans vous connecter, vérifiez que la note de démonstration est visible mais qu'aucune action (ajout/édition/suppression) n'est proposée.
2. **Cycle complet utilisateur** : Inscrivez-vous, ajoutez une note, modifiez-la, puis supprimez-la. Ouvrez une seconde fenêtre connectée au même compte pour vérifier la mise à jour temps réel.
3. **Autorisation stricte** : Avec deux comptes différents, tentez de modifier ou supprimer la note de l'autre (doit renvoyer 403 et afficher un message).
4. **Token expiré / supprimé** : Supprimez le token dans `localStorage` (via les outils navigateur) puis essayez d'ajouter une note : vous devez être redirigé vers le mode lecture seule.

## Choix techniques

- **Stockage en mémoire** pour se concentrer sur la logique de sécurité. Remplacer le tableau par une base de données nécessiterait d'adapter les opérations CRUD et l'émission Socket.IO.
- **`bcryptjs`** : version pure JS compatible sans compilation (utile dans un TP multiplateforme).
- **`JWT`** : payload minimal (`sub`, `username`) pour limiter les informations sensibles. Expiration configurable.
- **`io.fetchSockets()`** non nécessaire ici (pas de compteur) mais l'adapter Redis est possible pour scaler.
- **Frontend léger** : pas de dépendance externe, facilite l'analyse de la logique d'auth + UI conditionnelle.

## Limites

- Les données se réinitialisent à chaque redémarrage (pas de persistance disque).
- Pas de rafraîchissement de token ni de blacklist. Pour un usage réel, ajouter un mécanisme de rotation/refresh.
- L'authentification Socket.IO est optionnelle (lecture ne nécessite pas de token). Selon les besoins, verrouillez complètement les événements WebSocket.

Bon apprentissage !
