# Socket.IO Multi-Room Chat

Application de chat en temps réel permettant aux utilisateurs de créer, parcourir et rejoindre des salons pour échanger des messages visibles uniquement par les membres connectés.

## Installation

```bash
npm install
```

## Lancement

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000`. Ouvrez la page dans plusieurs onglets ou navigateurs, choisissez un pseudo, sélectionnez un salon existant (ou créez-en un depuis la colonne de gauche) puis échangez des messages.

## Fonctionnalités

- Colonne latérale listant les salons disponibles avec le nombre de participants connectés et création rapide de nouveaux salons.
- `create room` : validation du nom (taille, doublons) et diffusion immédiate de la liste mise à jour à tous les clients.
- `join room` : attribution d'un pseudo, bascule automatique depuis l'ancien salon et stockage des informations dans `socket.data`.
- `chat message` : diffusion des messages uniquement aux membres du salon actif (`io.to(room).emit`) avec horodatage.
- Notifications système à l'entrée/sortie d'un salon et mise à jour automatique de la liste des salons.
