# Réponses – Exercice 8 (Partie A)

## Question 1 – Services cloud temps réel
**a.** Firebase Realtime Database et Ably Realtime sont deux services managés permettant la synchro live sans WebSocket natif côté développeur.  
**b.**
- *Modèle de données* : Firebase expose une base hiérarchique JSON, Ably manipule des canaux de messages (pub/sub) éventuellement structurés en objets.  
- *Persistance* : Firebase persiste nativement chaque nœud dans l’infrastructure Google, Ably stocke les messages sur une courte rétention (persisted history) mais n’assure pas une base complète, il faut un store externe pour l’état durable.  
- *Mode d’écoute* : Firebase pousse les changements via un protocole propriétaire sur WebSockets/long-polling, Ably utilise des channels pub/sub multiplexés (WebSocket / MQTT) avec présence et history.  
- *Scalabilité* : Firebase shard automatiquement la base mais exige de soigner la structuration des clés, Ably fait du partitionnement horizontal de canaux et offre des SLA de diffusion avec auto-scale.  
**c.** Firebase convient bien à des applications CRUD collaboratives (todo list, app mobile) où l’état persistant est central. Ably est idéal pour des flux d’événements (suivi logistique, données IoT) demandant un bus pub/sub managé et des fonctionnalités de présence.

## Question 2 – Sécurité temps réel
**a.**  
1. DDoS via connexions persistantes → limiter le nombre de sockets et utiliser du rate limiting/token bucket par identifiant.  
2. Injection de messages (XSS, payload binaire) → valider/sanitiser côté serveur, encoder les sorties côté client.  
3. Escalade d’identité (vol de token) → stocker les tokens de session hachés, régénérer régulièrement, vérifier l’origine.  
**b.** La gestion d’identités garantit que chaque flux temps réel est associé à un principal vérifié (authn) et que les autorisations (authz) peuvent être appliquées à chaque event, ce qui évite qu’un client modifie les données d’un autre ou capte des informations sensibles.

## Question 3 – WebSockets vs Webhooks
**a.** WebSocket = canal bidirectionnel persistant entre client et serveur. Webhook = appel HTTP émis par un service A vers un endpoint public de service B lorsqu’un événement survient.  
**b.**  
*WebSocket* : + Temps réel quasi instantané ; + bi-directionnel. − Connexion persistante (coût sur serveurs/balanciers) ; − nécessite un client connecté.  
*Webhook* : + Simple (HTTP standard) ; + totalement découplé (pas besoin de client connecté). − Délai dépend du réseau ; − unidirectionnel et nécessite un endpoint exposé.  
**c.** On préfère un webhook quand on doit prévenir un service externe d’un changement ponctuel (ex : notifier un CRM lors d’un paiement) sans maintenir une connexion ouverte continue.

## Question 4 – CRDT & collaboration
**a.** Un CRDT (Conflict-free Replicated Data Type) est une structure de données distribuée conçue pour converger vers le même état sur tous les nœuds malgré des mises à jour concurrentes sans coordination centrale.  
**b.** Exemple : édition collaborative de texte hors ligne (éditeur type Google Docs) ou compteur distribué multi-sites.  
**c.** Le CRDT encode chaque opération de façon commutative/monotone (ex : G-Counter n’utilise que des additions positives par replica). Même si les messages arrivent dans un ordre différent, les propriétés mathématiques garantissent que la fusion produit le même état.

## Question 5 – Monitoring temps réel
**a.** Trois métriques clés : nombre de connexions actives, latence aller-retour moyenne, taux d’événements (messages/s).  
**b.** Prometheus collecte périodiquement ces métriques exposées via HTTP, Grafana permet de les visualiser en dashboards avec alertes temporelles (ex : alerte si latence > 200 ms).  
**c.** Logs = messages textuels détaillés contextualisant une action. Traces = suivi distribué d’une requête à travers plusieurs services (span, correlation-id). Métriques = valeurs numériques agrégées dans le temps (compteur, histogramme) prêtes pour de l’alerting.

## Question 6 – Déploiement & connexions persistantes
**a.** Les connexions WebSockets s’accrochent à un worker : le load balancer doit faire du sticky session ou partager l’état via un adapter (Redis). Elles occupent des file descriptors, donc la scalabilité passe par le scaling horizontal et la régulation du nombre de sockets.  
**b.** Kubernetes facilite ce modèle : autoscaling (HPA) pour absorber les pics, configuration réseau (Services, Ingress) pour le sticky ou le proxy TCP, et rolling updates contrôlés sans casser toutes les connexions.

## Question 7 – Stratégies de résilience client
**a.**  
1. Reconnexion automatique avec délais progressifs.  
2. File d’attente locale des actions non envoyées pour rejouer après reconnexion.  
3. Détection offline/online (event `visibilitychange`/`navigator.onLine`) pour informer l’utilisateur et éviter de perdre input.  
**b.** L’exponential backoff consiste à espacer les tentatives de reconnexion de façon exponentielle (ex : 1s, 2s, 4s...) pour éviter de saturer le serveur pendant une panne tout en garantissant une reprise rapide lorsque le service revient.
