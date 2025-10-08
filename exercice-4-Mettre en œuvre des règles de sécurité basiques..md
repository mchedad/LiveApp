Bonjour ! Ce TP vous guidera dans la mise en œuvre de règles de sécurité essentielles pour une application collaborative en temps réel. L'objectif est de vous faire manipuler les concepts d'authentification et d'autorisation dans un contexte pratique.

---

## TP : Sécurisation d'une Application Collaborative en Temps Réel

### Contexte

Vous allez développer une application de tableau de bord collaboratif, un peu comme un "Post-it" virtuel, où plusieurs utilisateurs peuvent ajouter, modifier et supprimer des notes en temps réel. Chaque note sera associée à son créateur.

### Objectif Pédagogique

Mettre en œuvre des mécanismes d'authentification et d'autorisation pour sécuriser l'accès aux fonctionnalités d'écriture et garantir la propriété des données dans une application temps réel.

### Énoncé du Problème

L'application de tableau de bord collaboratif doit garantir les règles de sécurité suivantes :

1.  **Accès en écriture restreint :** Seuls les utilisateurs authentifiés peuvent créer, modifier ou supprimer des notes. Les utilisateurs non authentifiés peuvent uniquement consulter les notes.
2.  **Propriété des données :** Un utilisateur ne peut modifier ou supprimer que les notes qu'il a lui-même créées.

### Prérequis

*   Connaissances de base en JavaScript (ES6+), Node.js et npm.
*   Familiarité avec les concepts de serveurs HTTP (Express.js est un bon choix).
*   Notions sur les WebSockets (Socket.IO sera utilisé).
*   Compréhension des principes d'authentification (JWT sera privilégié).

### Architecture Proposée (Simplifiée)

Pour ce TP, nous allons privilégier la simplicité pour nous concentrer sur la sécurité.

*   **Backend :** Node.js avec Express.js pour l'API REST et la gestion des WebSockets (Socket.IO).
*   **Frontend :** Une application HTML/CSS/JavaScript simple, sans framework complexe, pour interagir avec le backend.
*   **Authentification :** JSON Web Tokens (JWT) pour gérer les sessions utilisateur.
*   **Données :** Pour simplifier, les notes et les utilisateurs seront stockés dans des tableaux en mémoire côté serveur (ou un simple fichier JSON si vous préférez la persistance entre les redémarrages).

### Étapes du TP

#### Partie 1 : Application Collaborative de Base (Non Sécurisée)

1.  **Mise en place du serveur Express.js :**
    *   Créez un projet Node.js et installez `express` et `socket.io`.
    *   Mettez en place un serveur Express.js écoutant sur un port (ex: 3000).
    *   Configurez `socket.io` pour qu'il utilise le même serveur HTTP.
2.  **Gestion des notes :**
    *   Créez un tableau en mémoire pour stocker les notes. Chaque note doit avoir au minimum : `id` (unique), `content` (texte), `authorId` (pour l'instant, un identifiant factice ou null).
    *   Implémentez les routes API REST suivantes :
        *   `GET /notes` : Retourne toutes les notes.
        *   `POST /notes` : Ajoute une nouvelle note (pour l'instant, sans vérification d'utilisateur).
        *   `PUT /notes/:id` : Met à jour une note existante.
        *   `DELETE /notes/:id` : Supprime une note.
3.  **Communication Temps Réel :**
    *   Lorsqu'une note est ajoutée, modifiée ou supprimée via l'API REST, utilisez `socket.io` pour diffuser l'information à tous les clients connectés (ex: `io.emit('notes_updated', notes)`).
4.  **Frontend simple :**
    *   Créez un fichier `index.html` avec du JavaScript pour :
        *   Afficher la liste des notes.
        *   Permettre d'ajouter une nouvelle note.
        *   Permettre de modifier et supprimer des notes existantes.
        *   Écouter les événements `notes_updated` de `socket.io` pour rafraîchir l'affichage en temps réel.

#### Partie 2 : Authentification des Utilisateurs

1.  **Gestion des utilisateurs :**
    *   Créez un tableau en mémoire pour stocker les utilisateurs. Chaque utilisateur doit avoir : `id` (unique), `username`, `password` (haché, utilisez `bcrypt` pour cela).
    *   Installez `jsonwebtoken` et `bcrypt`.
    *   Implémentez les routes API REST suivantes :
        *   `POST /register` : Permet à un nouvel utilisateur de s'inscrire (hachez le mot de passe avant de le stocker).
        *   `POST /login` : Vérifie les identifiants, génère un JWT contenant l'ID de l'utilisateur et le renvoie au client.
2.  **Intégration Frontend :**
    *   Ajoutez des formulaires de connexion et d'inscription à votre `index.html`.
    *   Lors d'une connexion réussie, stockez le JWT reçu dans le `localStorage` du navigateur.
    *   Modifiez le frontend pour inclure le JWT dans l'en-tête `Authorization` (Bearer Token) de toutes les requêtes API nécessitant une authentification.

#### Partie 3 : Autorisation et Contrôle d'Accès

1.  **Middleware d'authentification :**
    *   Créez un middleware Express.js qui :
        *   Vérifie la présence d'un JWT valide dans l'en-tête `Authorization`.
        *   Décode le JWT pour extraire l'ID de l'utilisateur.
        *   Attache l'ID de l'utilisateur à l'objet `req` (ex: `req.userId`).
        *   Si le JWT est invalide ou absent, renvoie une erreur 401 Unauthorized.
2.  **Application des règles d'accès :**
    *   **Accès en écriture restreint :**
        *   Appliquez le middleware d'authentification aux routes `POST /notes`, `PUT /notes/:id`, `DELETE /notes/:id`.
        *   Dans la route `POST /notes`, utilisez `req.userId` pour définir l'`authorId` de la nouvelle note.
    *   **Propriété des données :**
        *   Dans les routes `PUT /notes/:id` et `DELETE /notes/:id`, après avoir authentifié l'utilisateur, vérifiez que l'`authorId` de la note à modifier/supprimer correspond à `req.userId`.
        *   Si ce n'est pas le cas, renvoyez une erreur 403 Forbidden.
3.  **Adaptation du Frontend :**
    *   Modifiez l'affichage des notes pour que les boutons "Modifier" et "Supprimer" ne soient visibles et actifs que si l'utilisateur connecté est l'auteur de la note.

#### Partie 4 : Sécurité des Communications Temps Réel

1.  **Authentification Socket.IO (Optionnel mais recommandé) :**
    *   Pour une sécurité plus robuste, vous pouvez demander au client d'envoyer son JWT lors de la connexion Socket.IO ou lors d'événements spécifiques. Le serveur peut alors valider ce JWT pour associer la connexion Socket.IO à un utilisateur authentifié.
2.  **Contrôle d'accès pour les événements Socket.IO :**
    *   Si vous implémentez des événements Socket.IO pour la modification/suppression directe de notes (plutôt que de passer par l'API REST), assurez-vous que les mêmes règles d'autorisation (vérification de l'`authorId` vs. `userId`) sont appliquées côté serveur avant de traiter l'événement.

#### Partie 5 : Tests et Validation

1.  **Scénarios de test :**
    *   Tentez de créer, modifier, supprimer des notes en étant non authentifié.
    *   Connectez-vous avec un utilisateur A, créez une note.
    *   Tentez de modifier/supprimer la note de l'utilisateur A avec l'utilisateur A.
    *   Connectez-vous avec un utilisateur B, tentez de modifier/supprimer la note de l'utilisateur A.
    *   Vérifiez le comportement en temps réel avec plusieurs navigateurs ou clients connectés simultanément.

### Livrables

*   Le code source complet de votre application (backend et frontend).
*   Un fichier `README.md` expliquant comment lancer l'application et décrivant les choix techniques majeurs concernant la sécurité.
*   (Optionnel) Une courte vidéo ou des captures d'écran montrant l'application en fonctionnement et les différents scénarios de sécurité testés.

### Conseils pour l'utilisation de l'IA

L'IA est un outil formidable pour vous aider dans ce TP. Utilisez-la intelligemment :

*   **Génération de squelettes :** Demandez-lui de générer la structure de base d'un serveur Express, d'un middleware JWT, ou d'un client Socket.IO.
*   **Explication de concepts :** Si un concept (comme le hachage de mot de passe, le fonctionnement d'un JWT, ou la gestion des WebSockets) n'est pas clair, demandez des explications ou des exemples.
*   **Débogage :** Si vous rencontrez une erreur, copiez le message d'erreur et le code pertinent à l'IA pour obtenir des pistes de résolution.
*   **Refactoring et bonnes pratiques :** Demandez-lui des suggestions pour améliorer la clarté ou la robustesse de votre code.

**Important :** Le but de ce TP est votre apprentissage. Ne vous contentez pas de copier-coller des solutions complètes sans les comprendre. Chaque ligne de code doit avoir un sens pour vous. Utilisez l'IA comme un assistant, pas comme un remplaçant de votre propre réflexion.

### Critères d'Évaluation

*   **Fonctionnalité :** L'application de base fonctionne-t-elle comme prévu (création, lecture, modification, suppression de notes, mise à jour temps réel) ?
*   **Respect des règles de sécurité :**
    *   L'authentification est-elle correctement implémentée (inscription, connexion, JWT) ?
    *   Les règles d'autorisation sont-elles respectées (seuls les authentifiés écrivent, seul le propriétaire modifie/supprime) ?
*   **Qualité du code :** Le code est-il lisible, bien structuré et commenté ?
*   **Compréhension :** Le `README.md` démontre-t-il une bonne compréhension des mécanismes de sécurité mis en place ?

---

Bon courage pour ce TP ! C'est une excellente occasion de solidifier vos compétences en développement d'applications sécurisées et en temps réel.