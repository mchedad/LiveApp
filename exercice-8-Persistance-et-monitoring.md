
**Examen Final – Développement d’Applications Web Temps Réel**

**Durée : 4h00**
**Matériel autorisé : ordinateur personnel + documentation personnelle locale + internet.**
**Accès interdit : IA, Cloud public (pas de déploiement VPS), services externes nécessitant un backend distant.**

## **Structure du TP**

* **Partie A – Théorie (1h30) – 50 points**
* **Partie B – Pratique (2h30) – 50 points**


## **PARTIE A – Théorie (1h30 – 50 points)**

Vos réponses seront données dans un fichier answers.md ou answers.txt

### **Question 1 – Services cloud temps réel**

a) Citez deux services managés permettant la synchro temps réel (hors WebSocket natif).

b) Comparez ces deux services selon :

* modèle de données,
* persistance,
* mode d’écoute,
* scalabilité.

Expliquez vos réponses

  c) Donnez un cas d’usage préféré pour chacun.


### **Question 2 – Sécurité temps réel**

a) Donnez trois risques liés au temps réel (ex : DDoS via connexions persistantes) et comment s’en protéger.

b) Expliquez l’importance de la gestion des identités en temps réel.


### **Question 3 – WebSockets vs Webhooks**

a) Définissez chaque technologie.

b) Donnez deux avantages et deux limites de chaque.

c) Dans quel cas un Webhook est préférable ? Justifiez.


### **Question 4 – CRDT & Collaboration**

a) Définissez un **CRDT**.

b) Donnez un exemple concret de situation où l’utiliser.

c) Expliquez pourquoi un CRDT évite les conflits de modifications distribuées.


### **Question 5 – Monitoring temps réel**

a) Citez trois métriques clés à surveiller dans une application temps réel.

b) Expliquez comment des outils comme Prometheus/Grafana aident dans ce contexte.

c) Quelle est la différence entre **logs**, **traces**, et **métriques** ?


### **Question 6 – Déploiement & Connexions persistantes**

a) Expliquez comment les connexions WebSockets impactent :

* load balancing,
* scalabilité.

b) Pourquoi Kubernetes est souvent utilisé dans ce contexte ?


### **Question 7 – Stratégies de résilience client**

a) Décrivez trois mécanismes côté client pour gérer les déconnexions.

b) Expliquez brièvement le principe d’exponential backoff.





## **PARTIE B – Pratique (2h30 – 50 pts)**

##  **Objectif**

Développer localement une **mini-application Web temps réel** permettant :

* de partager une liste d’items (ex : messages, tâches, signaux),
* synchronisée en temps réel entre plusieurs onglets du navigateur,
* avec persistance locale,
* gestion d’identités de session,
* monitoring basique.


## **Contraintes techniques**

✅ Vous devez **implémenter un canal temps réel** en local (pas de cloud) :

* WebSockets **ou** WebRTC.

✅ Vous devez **persister** les données **localement** :

* SQLite local.

✅ Vous devez **authentifier** l’utilisateur (simple mais non triviale) :

* pseudo + token local, hash minimal, etc.

✅ Vous devez implémenter **au moins trois règles de sécurité** :

Par exemple :

* actions limitées par utilisateur,
* validation côté serveur,
* sanitisation contre injection.

✅ Vous devez gérer la **reconnexion automatique** en cas de perte de connexion.

✅ Vous devez mettre en place un **monitoring minimal** :

* compteur de connexions,
* affichage de la latence estimée,
* logs de synchronisation.


## **Livrables**

* Fichier de réponses concernant la partie théorique answers.md ou answers.txt
* Dossier projet complet (code)
* README contenant :

  * architecture logique,
  * choix technologiques,
  * plan de sécurité,
  * gestion des erreurs,
  * limites et améliorations possibles.


## **Résultat attendu**

L’application permet :

* d’ouvrir **au moins deux onglets**,
* qu'une modification (ajout d’item, édition, suppression) se propage **instantanément**,
* de visualiser les utilisateurs connectés.


##  Bonus (+4 pts)

Implémentation d’un **CRDT simplifié** (ex : G-Counter, LWW-element-set) OU visualisation des logs de synchronisation.


# Conseils

* Commencez par la structure du serveur/worker.
* Implémentez d’abord la synchro minimale.
* Ajoutez la sécurité **avant** les raffinements UI.
* Logguez tout ce qui se passe : ça aide au debugging.
