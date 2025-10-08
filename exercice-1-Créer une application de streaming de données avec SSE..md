Bonjour ! Prêt à plonger dans le monde du temps réel avec SSE ? Ce TP vous guidera à travers la création d'une application simple mais efficace pour diffuser des données.

---

## TP : Streaming de Données en Temps Réel avec Server-Sent Events (SSE)

### Objectif du TP

Mettre en œuvre une application simple de streaming de données en temps réel en utilisant la technologie Server-Sent Events (SSE). Vous développerez un serveur capable d'envoyer des mises à jour continues et un client web pour les recevoir et les afficher dynamiquement.

### Contexte

Les applications modernes nécessitent souvent des mises à jour en temps réel sans que le client n'ait à interroger constamment le serveur. Server-Sent Events (SSE) est une technologie web qui permet à un serveur d'envoyer des mises à jour unidirectionnelles à un client via une connexion HTTP persistante. C'est une alternative plus simple aux WebSockets lorsque la communication bidirectionnelle n'est pas nécessaire, idéale pour la diffusion de flux d'informations (actualités, cotations boursières, notifications, etc.).

### Prérequis

*   Connaissances de base en Python (pour le serveur) et Flask.
*   Connaissances de base en HTML, CSS et JavaScript (pour le client).
*   Un environnement Python 3 fonctionnel avec `pip`.
*   Un éditeur de code (VS Code, Sublime Text, etc.).

**Note sur l'IA :** N'hésitez pas à utiliser des outils d'IA générative pour vous aider dans la rédaction du code, la compréhension des concepts ou la résolution de problèmes. L'objectif est d'apprendre et de maîtriser la technologie, pas de réinventer la roue. Utilisez l'IA comme un assistant intelligent pour accélérer votre apprentissage et votre développement.

### Énoncé du TP

Vous allez créer une application qui simule la diffusion de cotations boursières fictives en temps réel. Le serveur générera des prix aléatoires pour quelques actions et les enverra au client via SSE. Le client affichera ces cotations et les mettra à jour à mesure qu'elles arrivent.

---

#### Partie 1 : Le Serveur SSE (Python avec Flask)

Le serveur sera responsable de :
1.  Générer des données de cotations boursières fictives.
2.  Mettre en place un endpoint SSE qui diffuse ces données.

**Étapes :**

1.  **Initialisation du projet :**
    *   Créez un dossier pour votre projet (ex: `sse_stock_app`).
    *   Installez Flask : `pip install Flask`

2.  **Création du fichier `server.py` :**
    *   Importez les modules nécessaires : `Flask`, `Response`, `json`, `time`, `random`.
    *   Initialisez votre application Flask.
    *   Définissez une fonction `generate_stock_data()` qui simule la génération de cotations. Cette fonction devrait :
        *   Maintenir une liste de symboles boursiers (ex: `AAPL`, `GOOG`, `MSFT`, `AMZN`).
        *   Pour chaque symbole, générer un prix aléatoire (par exemple, entre 100 et 200) et une variation aléatoire (positive ou négative).
        *   Retourner ces données sous forme de dictionnaire.
    *   Créez un endpoint `/stream` qui sera l'interface SSE :
        *   Cette route doit retourner un objet `Response` avec le `mimetype` défini à `text/event-stream`.
        *   À l'intérieur de cette route, utilisez une boucle infinie (`while True`) pour :
            *   Appeler `generate_stock_data()`.
            *   Formater les données pour SSE. Le format standard est `data: <votre_json>\n\n`. N'oubliez pas les deux `\n` finaux pour délimiter les événements.
            *   Utilisez `yield` pour envoyer les données.
            *   Ajoutez un `time.sleep()` pour simuler un intervalle de mise à jour (ex: toutes les 2 secondes).
        *   **Important :** Ajoutez les en-têtes `Cache-Control: no-cache` et `X-Accel-Buffering: no` à votre réponse pour s'assurer que les événements sont envoyés immédiatement et ne sont pas mis en cache par les proxys.
    *   Définissez une route racine (`/`) qui servira simplement votre fichier `index.html` (que nous créerons à la Partie 2).

**Exemple de structure de code pour `server.py` (à compléter) :**

```python
from flask import Flask, Response, render_template
import json
import time
import random

app = Flask(__name__)

# Prix initiaux pour simuler des variations
stock_prices = {
    "AAPL": 170.00,
    "GOOG": 1500.00,
    "MSFT": 250.00,
    "AMZN": 130.00
}

def generate_stock_update():
    """Génère une mise à jour aléatoire pour une action."""
    symbol = random.choice(list(stock_prices.keys()))
    current_price = stock_prices[symbol]
    
    # Simule une variation de prix
    change_percent = random.uniform(-0.5, 0.5) / 100 # +/- 0.5%
    new_price = current_price * (1 + change_percent)
    new_price = round(new_price, 2) # Arrondir à 2 décimales
    
    stock_prices[symbol] = new_price # Mettre à jour le prix pour la prochaine itération
    
    return {
        "symbol": symbol,
        "price": new_price,
        "change": round(new_price - current_price, 2) # Calculer le changement réel
    }

@app.route('/')
def index():
    return render_template('index.html') # Assurez-vous d'avoir un dossier 'templates' avec index.html

@app.route('/stream')
def stream():
    def event_stream():
        while True:
            stock_data = generate_stock_update()
            # Format SSE: data: <votre_json>\n\n
            yield f"data: {json.dumps(stock_data)}\n\n"
            time.sleep(2) # Envoyer une mise à jour toutes les 2 secondes

    return Response(event_stream(), mimetype='text/event-stream', headers={
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no" # Important pour Nginx/proxies
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

#### Partie 2 : Le Client Web (HTML/JavaScript)

Le client sera une page web simple qui :
1.  Établit une connexion SSE avec le serveur.
2.  Reçoit les données de cotations.
3.  Met à jour l'affichage en temps réel.

**Étapes :**

1.  **Création du fichier `index.html` :**
    *   Dans le dossier de votre projet, créez un dossier `templates`.
    *   À l'intérieur de `templates`, créez un fichier `index.html`.
    *   Structurez votre HTML avec un titre et un conteneur (`div` ou `ul`) où les cotations seront affichées.
    *   Ajoutez une section `<script>` pour votre code JavaScript.

2.  **Code JavaScript :**
    *   Utilisez l'objet `EventSource` pour vous connecter à l'endpoint SSE de votre serveur (`/stream`).
    *   Écoutez l'événement `onmessage` de l'`EventSource`. Cet événement sera déclenché chaque fois que le serveur envoie des données.
    *   À l'intérieur du gestionnaire `onmessage` :
        *   Récupérez les données de l'événement (`event.data`). Elles seront au format JSON.
        *   Parsez les données JSON.
        *   Mettez à jour le DOM pour afficher la nouvelle cotation. Si la cotation existe déjà, mettez-la à jour ; sinon, créez un nouvel élément.
        *   Pensez à un moyen visuel simple pour indiquer si le prix a augmenté ou diminué (par exemple, changer la couleur du texte).
    *   Ajoutez un gestionnaire `onerror` pour gérer les problèmes de connexion.

**Exemple de structure de code pour `index.html` (à compléter) :**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotations Boursières en Temps Réel (SSE)</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; }
        h1 { color: #333; }
        #stock-quotes {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 20px;
        }
        .stock-card {
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stock-card h2 {
            margin-top: 0;
            color: #0056b3;
        }
        .stock-card p {
            margin: 5px 0;
            font-size: 1.1em;
        }
        .price-up { color: green; font-weight: bold; }
        .price-down { color: red; font-weight: bold; }
        .price-unchanged { color: gray; }
    </style>
</head>
<body>
    <h1>Cotations Boursières en Temps Réel</h1>
    <div id="stock-quotes">
        <!-- Les cotations seront insérées ici par JavaScript -->
    </div>

    <script>
        const eventSource = new EventSource('/stream');
        const stockQuotesDiv = document.getElementById('stock-quotes');
        const stockElements = {}; // Pour stocker les références aux éléments de stock existants

        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            const symbol = data.symbol;
            const price = data.price;
            const change = data.change;

            let stockCard = stockElements[symbol];

            if (!stockCard) {
                // Créer une nouvelle carte si elle n'existe pas
                stockCard = document.createElement('div');
                stockCard.className = 'stock-card';
                stockCard.id = `stock-${symbol}`;
                stockCard.innerHTML = `
                    <h2>${symbol}</h2>
                    <p>Prix: <span class="price"></span></p>
                    <p>Changement: <span class="change"></span></p>
                `;
                stockQuotesDiv.appendChild(stockCard);
                stockElements[symbol] = stockCard;
            }

            // Mettre à jour les informations
            const priceSpan = stockCard.querySelector('.price');
            const changeSpan = stockCard.querySelector('.change');

            priceSpan.textContent = `${price} €`;
            changeSpan.textContent = `${change} €`;

            // Appliquer la couleur en fonction du changement
            changeSpan.classList.remove('price-up', 'price-down', 'price-unchanged');
            if (change > 0) {
                changeSpan.classList.add('price-up');
            } else if (change < 0) {
                changeSpan.classList.add('price-down');
            } else {
                changeSpan.classList.add('price-unchanged');
            }
        };

        eventSource.onerror = function(err) {
            console.error("EventSource failed:", err);
            // Gérer les erreurs de connexion, par exemple afficher un message à l'utilisateur
        };
    </script>
</body>
</html>
```

#### Partie 3 : Améliorations et Défis (Optionnel)

Une fois que l'application de base fonctionne, vous pouvez explorer les améliorations suivantes :

1.  **Gestion de plusieurs types d'événements :**
    *   Modifiez le serveur pour envoyer différents types d'événements (ex: `event: stock_update`, `event: market_alert`).
    *   Modifiez le client pour écouter ces événements spécifiques (`eventSource.addEventListener('stock_update', ...)`).
2.  **Identifiants d'événements :**
    *   Ajoutez un `id: <numéro_incrémental>` à chaque événement envoyé par le serveur.
    *   Comprenez comment `EventSource` utilise cet ID pour se reconnecter et reprendre le flux après une coupure.
3.  **Filtrage côté client :**
    *   Ajoutez des contrôles (boutons, champs de saisie) sur la page client pour filtrer les cotations affichées (ex: n'afficher que les actions dont le prix est supérieur à X, ou un symbole spécifique).
4.  **Historique des prix :**
    *   Pour chaque action, conservez un petit historique des 5-10 dernières cotations et affichez-le (par exemple, sous forme de mini-graphique texte ou de liste).
5.  **Déploiement simple :**
    *   Si vous avez un peu d'expérience, essayez de déployer votre application Flask sur un service gratuit comme Heroku ou Render pour la rendre accessible publiquement (cela nécessitera un `Procfile` et un `requirements.txt`).

---

### Pour lancer votre application

1.  Assurez-vous d'avoir `server.py` dans le dossier racine et `index.html` dans un sous-dossier `templates`.
2.  Ouvrez votre terminal dans le dossier racine du projet.
3.  Lancez le serveur Flask : `python server.py`
4.  Ouvrez votre navigateur web et accédez à `http://127.0.0.1:5000/` (ou le port indiqué par Flask).

Vous devriez voir les cotations boursières s'afficher et se mettre à jour en temps réel !

Bon courage pour ce TP ! N'hésitez pas à expérimenter et à poser des questions.