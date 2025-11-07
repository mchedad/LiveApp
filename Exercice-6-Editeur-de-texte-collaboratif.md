
# Examen Final – Applications Web Temps Réel (Durée : 4h00)

---

## Consignes générales

* **Durée** : 4h00
* **Travail individuel**
* **Documents autorisés** : documentation officielle (MDN, Node.js, Socket.IO, Redis, Express).
* **Technologies conseillées** : Node.js, Express, Socket.IO, Redis (facultatif).
* **Rendu attendu :**

  * Code source (`server/`, `client/`)
  * `README.md` (instructions d’exécution + choix techniques)
  * `answers.pdf` ou `answers.md` (réponses théoriques de la partie 1)

---

## Partie 1 – Théorie (1h00 – 30 points)

Répondez de manière argumentée (10 à 15 lignes maximum par question).

---

### **Question 1 – Les technologies temps réel**

Comparez **Polling long**, **Server-Sent Events (SSE)** et **WebSockets** en indiquant :

* Le **principe de fonctionnement** de chacun,
* Le **sens de communication** (client → serveur / serveur → client / bidirectionnel),
* Leurs **avantages et limites**,
* Un **cas d’usage typique** pour chaque technologie.

---

### **Question 2 – Les fondements de Socket.IO**

Expliquez le rôle et l’intérêt de ces trois mécanismes dans Socket.IO :

* **Namespaces**,
* **Rooms**,
* **Broadcast**.

Illustrez chacun avec un exemple concret.

---

### **Question 3 – Scalabilité et Redis Pub/Sub**

Une application Socket.IO est déployée sur **plusieurs instances** derrière un **load balancer**.

1. Pourquoi les messages émis depuis une instance peuvent-ils ne pas atteindre tous les clients ?
2. Comment **Redis Pub/Sub** résout-il ce problème ?
3. Représentez (sous forme d’un schéma texte ou diagramme) une architecture typique utilisant **Socket.IO + Redis Adapter**.

---

### **Question 4 – Sécurité et Monitoring**

1. Citez **3 risques de sécurité** dans une application temps réel (Socket.IO, WebSocket).
2. Décrivez **3 bonnes pratiques** pour limiter ces risques.
3. Indiquez **3 métriques ou indicateurs** à surveiller pour assurer le bon fonctionnement d’une application temps réel.
4. Citez **au moins un outil** ou une technique simple de monitoring applicable (ex : console, Prometheus, métriques internes, logs).

---

### **Question 5 – Bonnes pratiques**

Donnez 5 bonnes pratiques pour assurer la fiabilité et la performance d’une application web temps réel (côté serveur et client).

---

## 💻 **Partie 2 – Développement pratique (3h00 – 70 points + bonus)**

### **Contexte : Application “CollabBoard”**

La startup **CollabNow** souhaite créer un **tableau blanc interactif** (ou éditeur de texte collaboratif en temps réel) permettant à plusieurs utilisateurs connectés de travailler simultanément sur le même espace.

Chaque modification effectuée par un utilisateur doit être immédiatement visible par les autres.

---

### **Objectifs fonctionnels**

1. **Connexion et identification basique :**

   * Chaque utilisateur saisit un **pseudo** avant de rejoindre la session.
   * Le serveur conserve une liste simple des utilisateurs connectés.
   * À la connexion/déconnexion, un **événement `notification`** informe tous les clients.

2. **Collaboration temps réel :**

   * Les utilisateurs partagent un **espace de travail commun** :

     * soit un **éditeur de texte collaboratif** (`<textarea>` synchronisé),
     * soit un **tableau blanc** (Canvas HTML5).
   * Les modifications sont transmises en temps réel via **Socket.IO** (événement `update`).

3. **Rooms (espaces de travail) :**

   * Les utilisateurs peuvent créer ou rejoindre une **room** (ex: `room1`, `projetX`).
   * Les événements ne concernent que les utilisateurs d’une même room.

4. **Sécurité minimale :**

   * Utiliser un **token temporaire** (ou clé partagée) pour rejoindre une room (`?token=12345`).
   * Vérifier ce token côté serveur avant d’accepter la connexion Socket.IO.
   * Empêcher l’envoi de messages si l’utilisateur n’est pas authentifié.

5. **Monitoring basique :**

   * Le serveur doit afficher en console :

     * Le nombre de connexions actives,
     * Le nombre d’événements émis par minute (approximation simple),
     * Les rooms actives.
   * (Bonus) Affichage sur une page `/status` du serveur (JSON simple).

---

### **Exigences techniques**

* Stack : **Node.js + Express + Socket.IO**
* Organisation du projet :

  ```
  /server
    index.js
  /client
    index.html
    script.js
  ```
* Événements Socket.IO :

  * `connection`, `disconnect`
  * `notification` (arrivée/départ d’utilisateur)
  * `update` (modification du texte ou du dessin)
  * (optionnel) `typing` ou `drawing` pour la prévisualisation
* Aucun stockage persistant requis (tout en mémoire).

---

### **Bonus (+10 points)**

Configurer un **Redis Adapter** pour la synchronisation inter-serveurs avec :

```js
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
```

---

## 📤 **Livrables attendus**

* `server/` : code Node.js / Socket.IO
* `client/` : interface web
* `README.md` : instructions d’exécution + explication du choix d’architecture
* `answers.pdf` ou `answers.md` : réponses aux questions théoriques

---

## ✅ **Critères d’évaluation**

| Compétence                               | Détail                               | Points  |
| ---------------------------------------- | ------------------------------------ | ------- |
| Compréhension des concepts temps réel    | Choix technologique justifié         | 12      |
| Architecture Socket.IO claire            | Rooms, événements, structure propre  | 13      |
| Fonctionnalité temps réel opérationnelle | Collaboration fluide et synchronisée | 15      |
| Sécurité minimale (token, validation)    | Contrôle d’accès efficace            | 10      |
| Monitoring basique                       | Logs, comptage, /status              | 10      |
| Clarté du code et du README              | Organisation, commentaires           | 10      |
| Bonus                                    | Redis Adapter opérationnel           | +10     |

