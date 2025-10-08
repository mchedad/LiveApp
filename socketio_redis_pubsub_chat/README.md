# Socket.IO Redis Pub/Sub Chat

Application de chat temps réel basée sur Socket.IO. Les différentes instances serveur sont synchronisées via Redis Pub/Sub afin de diffuser les messages à tous les clients, quel que soit le processus qui les reçoit.

## Prérequis

- Node.js 18+ et npm.
- Redis accessible (local ou distant). Pour un test rapide&nbsp;:

```bash
docker run --name redis-chat -p 6379:6379 -d redis/redis-stack-server:latest
```

## Installation

```bash
npm install
```

Copiez ensuite le fichier `.env.example` si vous souhaitez personnaliser les variables (facultatif). Les valeurs par défaut sont&nbsp;:

- `PORT=4100`
- `REDIS_URL=redis://127.0.0.1:6379`

## Lancement d’une instance

```bash
npm start
# ou, pour recharger automatiquement (Node >= 18)
npm run dev
```

Ouvrez ensuite `http://localhost:4100` dans votre navigateur. Choisissez un pseudo puis envoyez des messages.

## Tester la scalabilité multi-instance

1. Vérifiez que Redis fonctionne et accepte les connexions (par défaut sur `localhost:6379`).
2. Lancez une seconde instance du serveur sur un autre port&nbsp;:

   ```bash
   PORT=4101 npm start
   ```

3. Ouvrez deux onglets navigateur&nbsp;: l’un sur `http://localhost:4100`, l’autre sur `http://localhost:4101`.
4. Envoyez des messages depuis chaque onglet&nbsp;: les échanges restent synchronisés car chaque instance Socket.IO publie et consomme les messages via Redis.

La pastille “Participants” reflète le nombre total de clients connectés, toutes instances confondues (calcul effectué à l’aide de `io.fetchSockets()` via l’adapter Redis).

## Fonctionnement interne

- `server.js` configure un serveur Express / Socket.IO et applique l’adapter `@socket.io/redis-adapter` avec deux connexions Redis (publication et souscription).
- Chaque message est encapsulé (type, auteur, horodatage) avant d’être émis via `io.emit`. L’adapter relaie automatiquement l’événement sur toutes les instances.
- Les messages système annoncent les connexions, changements de pseudo et déconnexions afin de vérifier visuellement la propagation multi-processus.
- Le client (`public/app.js`) gère l’inscription du pseudo, l’envoi de messages et l’affichage des notifications en temps réel. Il met à jour les indicateurs de connexion et le nombre total de participants.

## Dépannage

- **Impossible de se connecter** : vérifiez la valeur `REDIS_URL` et que Redis autorise les connexions depuis votre machine (pare-feu, mot de passe, etc.).
- **Aucun message ne circule entre les instances** : assurez-vous que toutes les instances pointent vers la même base Redis et que les ports ne sont pas bloqués.
- **Ports déjà utilisés** : modifiez `PORT` pour chaque instance supplémentaire.
