Ce TP vise à vous guider dans l'intégration de Redis Pub/Sub pour la diffusion d'événements, en améliorant une application de chat existante pour la rendre scalable.

---

## TP : Scalabilité d'une Application de Chat en Temps Réel avec Redis Pub/Sub

### Objectif du TP

Intégrer Redis Pub/Sub pour permettre la diffusion d'événements (messages de chat) entre plusieurs instances d'une application serveur, assurant ainsi la cohérence des communications en temps réel.

### Contexte

Vous disposez d'une application de chat simple, probablement développée lors d'un exercice précédent. Cette application fonctionne généralement avec un serveur unique (par exemple, basé sur Flask-SocketIO, Node.js avec Socket.IO, etc.). Tous les clients connectés à ce serveur unique peuvent échanger des messages.

Le problème survient lorsque vous souhaitez faire évoluer cette application :
1.  **Haute Disponibilité :** Si votre serveur unique tombe, l'application est hors service.
2.  **Scalabilité :** Un seul serveur peut gérer un nombre limité de connexions simultanées. Pour supporter plus d'utilisateurs, il faut pouvoir lancer plusieurs instances de votre application serveur.

Actuellement, si vous lancez deux instances de votre serveur de chat (par exemple, sur des ports différents), les clients connectés à l'instance A ne verront pas les messages envoyés par les clients connectés à l'instance B. Chaque instance est un "isoloir" de communication.

Redis Pub/Sub est une solution élégante pour briser ces isoloirs. Il permet à différentes instances de votre application de communiquer entre elles en publiant et en souscrivant à des "canaux" de messages.

### Prérequis

*   Connaissances de base en développement web (client/serveur, HTTP, WebSockets).
*   Maîtrise d'un langage de programmation (Python avec Flask-SocketIO ou Node.js avec Socket.IO sont des choix courants pour ce type d'application).
*   Notions de base sur Docker (facultatif mais recommandé pour Redis).
*   Un environnement de développement configuré (Python 3.x et `pip`, ou Node.js et `npm`).

### Énoncé du TP

L'objectif est de modifier votre application de chat existante pour qu'elle puisse fonctionner avec plusieurs instances de serveur, toutes connectées à Redis pour partager les messages.

#### Étape 0 : Point de Départ - Votre Application de Chat

Assurez-vous de disposer d'une application de chat fonctionnelle, même si elle ne gère qu'une seule instance de serveur.

Votre application de chat de base devrait avoir les fonctionnalités suivantes :
*   **Côté Serveur :** Un serveur (par exemple, Flask-SocketIO ou Node.js/Socket.IO) qui écoute les connexions WebSocket. Il doit gérer un événement de réception de message (`'message'`) et diffuser ce message à tous les clients *actuellement connectés à cette même instance de serveur*.
*   **Côté Client :** Un client HTML/JavaScript qui se connecte au serveur via WebSocket, envoie des messages texte et affiche les messages reçus.

*Si vous n'avez pas cette base, n'hésitez pas à utiliser l'IA pour générer un squelette minimal d'application de chat en temps réel avec le framework de votre choix (par exemple, "Génère une application de chat simple avec Flask-SocketIO et un client HTML/JS").*

#### Étape 1 : Installation et Configuration de Redis

1.  **Lancez une instance Redis :**
    Le moyen le plus simple est d'utiliser Docker :
    ```bash
    docker run --name my-redis -p 6379:6379 -d redis/redis-stack-server:latest
    ```
    (Si vous n'utilisez pas Docker, installez Redis localement selon la documentation de votre système d'exploitation).

2.  **Installez la bibliothèque Redis pour votre langage :**
    *   **Python :** `pip install redis`
    *   **Node.js :** `npm install ioredis` (ou `npm install redis` si vous préférez la bibliothèque officielle)

#### Étape 2 : Intégration de Redis Pub/Sub dans le Serveur de Chat

Modifiez le code de votre serveur de chat pour intégrer Redis Pub/Sub.

1.  **Connexion à Redis :**
    Établissez une connexion à votre instance Redis depuis votre application serveur.

2.  **Logique de Publication :**
    Lorsqu'un serveur reçoit un message d'un client (via WebSocket), au lieu de le diffuser directement à *ses* clients locaux, il doit :
    *   Publier ce message sur un canal Redis spécifique (par exemple, `'chat_messages'`). Le message doit contenir les informations nécessaires (expéditeur, contenu, etc.).

3.  **Logique de Souscription et de Diffusion :**
    Chaque instance de votre serveur doit également :
    *   Se souscrire au même canal Redis (`'chat_messages'`).
    *   Mettre en place un mécanisme pour écouter les messages provenant de ce canal Redis.
        *   **Attention :** La souscription à Redis est une opération bloquante. Vous devrez probablement lancer l'écoute dans un thread séparé ou utiliser des mécanismes asynchrones (par exemple, `asyncio` en Python, `async/await` en Node.js) pour ne pas bloquer le fonctionnement principal de votre serveur web.
    *   Lorsqu'un message est reçu de Redis, cette instance de serveur doit alors diffuser ce message à *tous les clients WebSocket qui lui sont localement connectés*.

#### Étape 3 : Test Multi-Instances

1.  **Lancez plusieurs instances de votre serveur :**
    Pour tester la scalabilité, lancez au moins deux instances de votre application serveur, chacune sur un port différent (par exemple, `python app.py --port 5000` et `python app.py --port 5001`, ou en modifiant le port dans le code avant de lancer chaque instance).

2.  **Ouvrez des clients :**
    Ouvrez plusieurs onglets de navigateur, connectez-vous à différentes instances de serveur (par exemple, un onglet sur `localhost:5000` et un autre sur `localhost:5001`).

3.  **Vérifiez la cohérence :**
    Envoyez des messages depuis n'importe quel client. Tous les clients, quelle que soit l'instance de serveur à laquelle ils sont connectés, devraient recevoir tous les messages.

### Livrables

*   Le code source complet de votre application de chat modifiée (serveur et client).
*   Un fichier `README.md` expliquant comment lancer l'application, comment lancer plusieurs instances de serveur, et comment tester la solution.
*   Une brève explication (dans le `README` ou oralement) de la manière dont Redis Pub/Sub résout le problème de la communication entre instances.

### Conseils et Pistes

*   **Sérialisation des messages :** Les messages envoyés via Redis Pub/Sub sont généralement des chaînes de caractères. Pensez à sérialiser vos objets message (par exemple, en JSON) avant de les publier, et à les désérialiser lors de la réception.

*   **Robustesse :** Que se passe-t-il si la connexion à Redis est perdue ? (Hors sujet pour ce TP, mais une bonne question à se poser pour une application de production).

*   **Identifiants de messages :** Pour éviter des boucles infinies ou des messages dupliqués si un serveur se publie à lui-même, assurez-vous que le serveur qui reçoit un message de Redis ne le republie pas sur Redis. Il doit juste le diffuser à ses clients locaux.

### Critères d'Évaluation

*   **Fonctionnalité :** L'application de chat fonctionne-t-elle correctement avec plusieurs instances de serveur ? Les messages sont-ils diffusés à tous les clients, quelle que soit l'instance à laquelle ils sont connectés ?
*   **Intégration Redis :** L'utilisation de Redis Pub/Sub est-elle correcte et efficace ?
*   **Clarté du code :** Le code est-il lisible, bien structuré et commenté si nécessaire ?
*   **Compréhension :** La capacité à expliquer le fonctionnement de la solution et les avantages de Redis Pub/Sub pour la scalabilité.