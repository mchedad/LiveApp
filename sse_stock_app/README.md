# SSE Stock App

Application de démonstration qui diffuse des cotations boursières fictives en temps réel via Server-Sent Events (SSE) avec Flask.

## Installation

```bash
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS / Linux
pip install -r requirements.txt
```

## Lancement

```bash
python server.py
```

Puis ouvrez `http://127.0.0.1:5000` dans votre navigateur. Ouvrez plusieurs onglets pour visualiser la diffusion multi-clients.

## Fonctionnement

- `/stream` publie un flux SSE qui envoie des mises à jour toutes les 2 secondes.
- Le client met à jour dynamiquement le prix, la variation et un mini-historique pour chaque action.
- Le bouton *Démarrer/Arrêter* permet d'activer ou couper le flux côté client.
