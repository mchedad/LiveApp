Voici un sujet de TP conçu pour illustrer le Long Polling, en tenant compte de l'utilisation de l'IA par les apprenants.

---

## TP : Implémentation d'un Système de Mise à Jour d'État avec Long Polling

### Objectif du TP

Implémenter un serveur et un client utilisant le mécanisme de Long Polling pour un système de notification de changement d'état.

### Contexte

Les applications modernes nécessitent souvent des mises à jour en temps quasi-réel sans recourir à des rechargements de page complets. Le Long Polling est une technique qui permet au serveur de "pousser" des informations au client dès qu'elles sont disponibles, sans maintenir une connexion persistante comme avec les WebSockets, ni surcharger le serveur avec du polling fréquent.

Dans ce TP, vous allez construire un système simple où un "état" (par exemple, le statut d'une tâche) est maintenu par un serveur. Les clients se connecteront pour recevoir des mises à jour de cet état dès qu'il change.

### Énoncé du Problème

Vous devez mettre en place un système de "mise à jour du statut d'une tâche" composé de deux éléments principaux :

1.  **Un Serveur (Back-end) :**
    *   Maintient l'état actuel d'une tâche (ex: "En attente", "En cours", "Terminée", "Échec").
    *   Expose une API pour que les clients puissent "s'abonner" aux mises à jour de cet état via Long Polling.
    *   Expose une API distincte (simulée par un endpoint simple) permettant de modifier manuellement l'état de la tâche.

2.  **Un Client (Front-end) :**
    *   Affiche l'état actuel de la tâche.
    *   Utilise le Long Polling pour recevoir les mises à jour du serveur et rafraîchir son affichage sans recharger la page.

### Prérequis

*   Connaissances de base en développement web (HTML, CSS, JavaScript).
*   Connaissances de base en développement back-end (Python/Flask, Node.js/Express, ou similaire).
*   Compréhension des requêtes HTTP (GET, POST).

### Consignes Générales

*   L'utilisation d'outils d'IA est encouragée pour vous aider dans la compréhension et la rédaction de code. Cependant, l'objectif principal de ce TP est votre *compréhension* des mécanismes sous-jacents du Long Polling.
*   Soyez capable d'expliquer vos choix techniques et le fonctionnement de votre code.
*   Le code doit être fonctionnel et démontrer clairement le principe du Long Polling.
*   Privilégiez la clarté et la simplicité de l'implémentation pour ce TP.

### Architecture Proposée

*   **Serveur :** Une application web légère (ex: Flask en Python, Express en Node.js) gérant les endpoints.
*   **Client :** Une page HTML simple avec du JavaScript pour interagir avec le serveur.

---

### Partie 1 : Le Serveur (Back-end)

**Objectif :** Implémenter la logique de gestion de l'état et le mécanisme de Long Polling.

**Fonctionnalités attendues :**

1.  **Gestion de l'état :**
    *   Maintenir une variable en mémoire pour le statut de la tâche (ex: `current_task_status = "En attente"`).
    *   Associer un "numéro de version" ou un "timestamp" à cet état pour savoir quand il a changé (ex: `status_version = 0`).

2.  **Endpoint de mise à jour (Admin) :**
    *   Créer un endpoint HTTP (ex: `POST /update-status`) qui accepte un nouveau statut en paramètre.
    *   Lorsqu'un nouveau statut est reçu, mettre à jour `current_task_status` et incrémenter `status_version`.
    *   Ce endpoint ne nécessite pas de Long Polling, il est juste là pour simuler un changement d'état.

3.  **Endpoint de Long Polling (Client) :**
    *   Créer un endpoint HTTP (ex: `GET /poll-status`).
    *   Ce endpoint doit accepter un paramètre `last_version` envoyé par le client.
    *   **Logique de Long Polling :**
        *   Si `last_version` est inférieur à `current_task_status_version`, le statut a changé. Renvoyer immédiatement le `current_task_status` et sa `status_version`.
        *   Si `last_version` est égal à `current_task_status_version`, le statut n'a pas changé. Le serveur doit *maintenir la connexion HTTP ouverte* pendant une durée maximale (ex: 25-30 secondes).
        *   Pendant que la connexion est maintenue, si `current_task_status` change (suite à un appel à `/update-status`), le serveur doit immédiatement renvoyer le nouveau statut et sa version à *toutes les requêtes en attente* et fermer ces connexions.
        *   Si le délai maximum est atteint sans changement d'état, le serveur doit renvoyer un statut indiquant "pas de changement" (ex: un code 204 No Content, ou un JSON vide) et fermer la connexion.

**Technologies suggérées :**

*   **Python :** Flask avec `threading.Event` ou `asyncio` pour gérer les requêtes en attente.
*   **Node.js :** Express avec des promesses ou `async/await` pour gérer les requêtes en attente.

**Étapes indicatives :**

1.  Initialiser votre application web.
2.  Définir les variables globales pour l'état et sa version.
3.  Implémenter l'endpoint `/update-status`.
4.  Implémenter l'endpoint `/poll-status`, en portant une attention particulière à la gestion des requêtes en attente. Vous devrez probablement stocker les objets `Response` ou `Deferred` des requêtes clientes en attente et les notifier lors d'un changement d'état.

---

### Partie 2 : Le Client (Front-end)

**Objectif :** Implémenter l'interface utilisateur et la logique de Long Polling côté client.

**Fonctionnalités attendues :**

1.  **Interface utilisateur :**
    *   Une page HTML simple avec un élément (ex: un `<span>` ou un `<div>`) pour afficher le statut actuel de la tâche.
    *   Un bouton ou un champ de texte pour simuler l'action d'un administrateur qui mettrait à jour le statut (cela appellera l'endpoint `/update-status` du serveur).

2.  **Logique de Long Polling :**
    *   Au chargement de la page, effectuer une première requête à `/poll-status` pour obtenir l'état initial.
    *   Après avoir reçu une réponse de `/poll-status` (que ce soit un nouveau statut ou un timeout), mettre à jour l'affichage si nécessaire.
    *   **Crucial :** Immédiatement après avoir traité la réponse (ou le timeout), relancer une nouvelle requête Long Polling vers `/poll-status` en envoyant la `last_version` du statut que le client connaît. Cela crée une boucle continue de Long Polling.
    *   Gérer les erreurs réseau ou les timeouts côté client pour relancer la requête.

**Technologies suggérées :**

*   **HTML, CSS, JavaScript.**
*   Utiliser l'API `Fetch` ou `XMLHttpRequest` pour les requêtes HTTP.

**Étapes indicatives :**

1.  Créer un fichier `index.html` avec les éléments UI nécessaires.
2.  Créer un fichier `script.js`.
3.  Dans `script.js`, implémenter une fonction `pollForStatus()` qui effectue la requête Long Polling.
4.  Gérer la réponse : mettre à jour l'UI, stocker la nouvelle version, et appeler `pollForStatus()` à nouveau.
5.  Implémenter la logique pour le bouton de mise à jour du statut (qui fera un `POST` vers `/update-status`).

---

### Partie 3 : Tests et Validation

1.  Lancez votre serveur.
2.  Ouvrez plusieurs onglets de navigateur sur la page client.
3.  Vérifiez que chaque client affiche le même statut initial.
4.  Utilisez le bouton de mise à jour du statut sur un des clients (ou un outil comme Postman/curl pour appeler `/update-status`).
5.  Observez que tous les clients ouverts mettent à jour leur affichage presque instantanément, sans recharger la page.
6.  Vérifiez que si aucun changement n'intervient, les requêtes Long Polling se relancent après le timeout défini côté serveur.

### Pour aller plus loin (Optionnel)

*   **Gestion des erreurs :** Ajouter une gestion plus robuste des erreurs réseau ou serveur.
*   **Multiples états :** Gérer plusieurs tâches ou plusieurs types d'états.
*   **Authentification :** Simuler une authentification simple pour l'endpoint de mise à jour.
*   **Comparaison :** Discuter des avantages et inconvénients du Long Polling par rapport au Polling traditionnel et aux WebSockets.
*   **Persistance :** Stocker l'état dans une base de données simple au lieu de la mémoire.

### Rendu

Votre rendu devra inclure :

*   Le code source complet de votre serveur et de votre client.
*   Un fichier `README.md` expliquant comment lancer votre application et les technologies utilisées.
*   Une brève explication (quelques paragraphes) de votre implémentation du Long Polling, en mettant en évidence les défis rencontrés et les solutions apportées.

---

Ce TP est une excellente occasion de maîtriser une technique fondamentale pour les applications réactives. N'hésitez pas à explorer et à expérimenter !