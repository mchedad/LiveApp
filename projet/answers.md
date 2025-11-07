# Partie 1 - Theorie

## Question 1 - Technologies temps reel
1. **Long Polling** : le client garde une requete HTTP ouverte jusqu'a reception d'un evenement puis relance. Avantages : support universel, simple. Limites : overhead HTTP, latence et charge serveur. Cas : notifications legacy.
2. **Server-Sent Events** : flux HTTP unidirectionnel (serveur -> client) via `EventSource`. Avantages : push natif, reconnexion auto, parfait pour broadcast. Limites : pas de messages client -> serveur, texte uniquement. Cas : monitoring live.
3. **WebSockets** : upgrade HTTP vers TCP full-duplex. Avantages : bidirection, faible latence, frames binaires/texte. Limites : exige LB compatible, securite plus fine. Cas : chat, collaboration, jeux.

## Question 2 - Fondements Socket.IO
- **Namespaces** : segments logiques (ex `/whiteboard`) possedant leurs middlewares et quotas; permet de separer admin/public.
- **Rooms** : groupes dynamiques dans un namespace (`socket.join(room)`) pour diffuser seulement a certains utilisateurs, utile pour une room par projet.
- **Broadcast** : emission ciblee (`socket.broadcast.emit`, `io.to(room).emit`) afin d'envoyer a tous sauf l'emetteur ou a un sous-ensemble precis.

## Question 3 - Scalabilite & Redis Pub/Sub
1. Avec plusieurs instances, un emit reste local; les clients sur un autre noeud ne recoivent rien.
2. L'adaptateur Redis publie chaque evenement sur un canal; toutes les instances abonnees le recoivent et le redispatchent localement.
3. Schema texte : `Clients -> Load Balancer -> {Node A, Node B}` tous relies a `Redis Pub/Sub`; chaque node fait tourner Socket.IO + adaptateur.

## Question 4 - Securite & Monitoring
1. Risques : payload XSS, sockets non authentifiees, spam d'evenements/DoS, interception sans TLS.
2. Protections : valider les champs, exiger un token ou JWT au handshake, limiter la frequence, chiffrer via HTTPS/WSS.
3. Metriques : connexions actives, latence/ACK moyen, evenements par minute, taux d'erreurs.
4. Outils : logs structures, endpoint `/status`, integration Prometheus/Grafana ou meme console avanc?e.

## Question 5 - Bonnes pratiques
1. Serveur : nettoyer l'etat des rooms, gerer `disconnect`, externaliser le travail bloquant (Redis, queues).
2. Client : implementer reconnexion avec backoff, debouncer les inputs texte/dessin.
3. Securite : verifier le token a chaque action, filtrer les payloads avant diffusion.
4. Performance : payloads compacts, throttling, compression si besoin.
5. Observabilite : exposer `/status`, compter les evenements, alerter sur les erreurs.
