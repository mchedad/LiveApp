Voici un sujet de TP pragmatique et direct, conçu pour des apprenants utilisant l'IA comme outil d'apprentissage et de développement.

---

## TP : Monitoring Basique d'une Application Temps Réel

### Contexte

Dans le développement d'applications temps réel, la capacité à observer et comprendre le comportement de votre système en production est fondamentale. Un système de monitoring simple permet d'identifier rapidement les goulots d'étranglement, les erreurs ou les dégradations de performance avant qu'elles n'affectent gravement l'expérience utilisateur.

### Objectif du TP

Mettre en place un monitoring simple pour une application déployée, en se concentrant sur les performances clés.

### Énoncé du TP

Vous allez intégrer un système de log et exposer des métriques basiques au sein d'une mini-application simulant un flux de données temps réel. L'objectif est d'observer en direct des indicateurs comme le nombre de connexions actives et la latence des requêtes.

---

### Mini-Projet : Simulateur de Flux de Données Temps Réel

Pour ce TP, nous allons construire une application web minimale qui simule la fourniture de données en temps réel.

**Description :**
L'application sera un service HTTP simple qui, à chaque requête sur un endpoint spécifique, génère et renvoie une petite quantité de données aléatoires (par exemple, un JSON avec un timestamp, une valeur numérique aléatoire et un identifiant). Pour simuler des conditions réelles, une latence artificielle sera introduite dans le traitement de chaque requête.

**Technologies Suggérées :**
*   **Langage :** Python
*   **Framework Web :** Flask

**Fonctionnalités Initiales à Implémenter :**

1.  **Endpoint `/data` :**
    *   Accepte les requêtes GET.
    *   Génère un dictionnaire JSON simple (ex: `{"id": "uuid", "timestamp": "current_time", "value": "random_float"}`).
    *   Introduit un délai aléatoire entre 50ms et 300ms avant de renvoyer la réponse (utilisez `time.sleep()` en Python).

---

### Partie 1 : Intégration d'un Système de Log

**Objectif :** Enregistrer les événements significatifs de l'application pour un diagnostic ultérieur et une observation en temps réel.

**Tâches :**

1.  **Configuration du Logging :**
    *   Utilisez le module de logging standard de votre langage (ex: `logging` en Python).
    *   Configurez le logger pour afficher les logs sur la console (stdout) avec un format incluant le timestamp, le niveau de log, le nom du logger et le message.
2.  **Log des Requêtes Entrantes :**
    *   À chaque réception d'une requête sur l'endpoint `/data`, loggez une ligne `INFO` contenant :
        *   Le timestamp de la requête.
        *   L'adresse IP du client.
        *   La méthode HTTP et le chemin (`GET /data`).
3.  **Log de la Latence de Traitement :**
    *   Mesurez le temps écoulé entre le début et la fin du traitement de la requête `/data` (incluant le `time.sleep()`).
    *   Loggez ce temps (en millisecondes) comme une ligne `INFO` ou `DEBUG` après avoir envoyé la réponse.
4.  **Log des Erreurs :**
    *   Implémentez un bloc `try-except` autour du traitement de la requête `/data`.
    *   En cas d'exception, loggez l'erreur avec le niveau `ERROR`, incluant la traceback complète.

**Indicateurs à observer via les logs :**
*   La latence individuelle de chaque requête.
*   Les requêtes provenant de différentes adresses IP.
*   La détection immédiate d'erreurs internes.

---

### Partie 2 : Exposition de Métriques Basiques

**Objectif :** Fournir un aperçu agrégé et en temps réel de l'état de l'application via un endpoint dédié.

**Tâches :**

1.  **Variables Globales de Métriques :**
    *   Maintenez des compteurs simples dans la mémoire de l'application (variables globales ou un objet singleton) :
        *   `total_requests_served` : Nombre total de requêtes traitées par `/data`.
        *   `active_connections` : Nombre de requêtes actuellement en cours de traitement.
        *   `total_latency_ms` : Somme cumulée de toutes les latences de requêtes (pour calculer une moyenne).
2.  **Mise à Jour des Métriques :**
    *   Incrémentez `active_connections` au début du traitement de `/data` et décrémentez-le à la fin.
    *   Incrémentez `total_requests_served` à la fin du traitement de `/data`.
    *   Ajoutez la latence mesurée de chaque requête à `total_latency_ms`.
3.  **Endpoint `/metrics` :**
    *   Créez un nouvel endpoint `GET /metrics`.
    *   Cet endpoint doit renvoyer un JSON ou un texte simple formaté, affichant les métriques collectées :
        *   `total_requests_served`
        *   `active_connections`
        *   `average_latency_ms` (calculé comme `total_latency_ms / total_requests_served` si `total_requests_served > 0`).

**Indicateurs à observer via l'endpoint `/metrics` :**
*   Le nombre de requêtes simultanées (connexions actives).
*   Le débit global de l'application (total des requêtes).
*   La latence moyenne agrégée sur toutes les requêtes.

---

### Partie 3 : Test et Observation

**Objectif :** Générer de la charge sur l'application et observer le comportement du monitoring.

**Tâches :**

1.  **Démarrage de l'Application :** Lancez votre application Flask.
2.  **Génération de Charge :**
    *   Utilisez un outil comme `curl`, `ApacheBench` (`ab`), ou un script Python simple pour envoyer un grand nombre de requêtes concurrentes à l'endpoint `/data`.
    *   Exemple avec `curl` (dans plusieurs terminaux ou un script) : `curl http://127.0.0.1:5000/data`
    *   Exemple avec `ab` (si installé) : `ab -n 1000 -c 10 http://127.0.0.1:5000/data` (1000 requêtes, 10 concurrentes)
3.  **Observation :**
    *   Dans un terminal séparé, observez les logs de votre application.
    *   Dans un autre terminal, interrogez régulièrement l'endpoint `/metrics` (ex: `watch -n 1 curl http://127.0.0.1:5000/metrics`).
4.  **Analyse :**
    *   Que remarquez-vous dans les logs lorsque la charge augmente ?
    *   Comment évoluent les métriques (`active_connections`, `average_latency_ms`) sous charge ?
    *   Les informations des logs et des métriques sont-elles cohérentes ?

---

### Rendu et Évaluation

Votre rendu comprendra :

1.  **Le code source** complet de votre application avec les intégrations de logging et de métriques.
2.  **Une brève explication** (quelques paragraphes) de vos choix techniques pour le logging et l'exposition des métriques.
3.  **Vos observations** sur le comportement de l'application sous charge, en vous basant sur les logs et les métriques collectées.

---

### Pour aller plus loin (Optionnel)

*   **Persistance des logs :** Configurez le logging pour écrire dans un fichier en plus de la console.
*   **Format de métriques standard :** Recherchez des formats de métriques plus standards comme Prometheus Text Format et essayez de l'implémenter pour l'endpoint `/metrics`.
*   **Visualisation simple :** Si vous avez des compétences en frontend, créez une page HTML simple qui rafraîchit et affiche les métriques de `/metrics` de manière graphique.