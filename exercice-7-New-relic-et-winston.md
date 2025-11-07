
# TP — Mise en œuvre de New Relic & Winston dans une application temps réel

## Pré-requis

* Node.js installé
* Compte New Relic gratuit ([https://newrelic.com/signup](https://newrelic.com/signup))
* Connaissances de base Express.js

---

## **Étape 1 — Créer l’application Node.js**

Dans un dossier vide, exécutez :

```bash
npm init -y
npm install express
```

Créez `index.js` :

```js
const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

Testez :

```bash
node index.js
curl http://localhost:3000/ping
```

---

## **Étape 2 — Installer New Relic**

### 2.1 Installer l’agent

```bash
npm install newrelic
```

### 2.2 Générer la configuration

```bash
cp node_modules/newrelic/newrelic.js .
```

### 2.3 Modifier `newrelic.js`

* Ajoutez votre `license_key` (depuis le dashboard)
* Configurez l’app :

```js
app_name: ['tp-realtime-demo']
```

### 2.4 Importer New Relic dans l’application

⚠️ L’import **doit être la première ligne** :

```js
require('newrelic');
const express = require('express');
// ...
```

Lancez l’app :

```bash
NEW_RELIC_LICENSE_KEY="VOTRE_CLE" node index.js
```

Générez du trafic :

```bash
for i in {1..50}; do curl http://localhost:3000/ping; done
```

Observez dans New Relic (APM → Transactions).

---

## **Étape 3 — Ajouter Winston**

Installez :

```bash
npm install winston
```

Dans `logger.js` :

```js
const { createLogger, format, transports } = require('winston');

module.exports = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'app.log' })
  ]
});
```

Modifiez `index.js` :

```js
require('newrelic');
const logger = require('./logger');
const express = require('express');
const app = express();

app.get('/ping', (req, res) => {
  logger.info('Ping received', { route: '/ping' });
  res.json({ message: 'pong' });
});

app.listen(3000, () => logger.info('Server started on port 3000'));
```

Relancez l’app, appelez `/ping` quelques fois, puis ouvrez `app.log`.

---

##  **Étape 4 — Simuler une latence**

Ajoutez une route lente :

```js
app.get('/slow', async (req, res) => {
  logger.warn('Slow endpoint triggered');
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ status: 'ok' });
});
```

Testez :

```bash
curl http://localhost:3000/slow
```

✅ Observez le spike de latence sur New Relic.

---

## **Étape 5 — Simuler une erreur**

```js
app.get('/error', (req, res) => {
  logger.error('Unexpected error occurred');
  throw new Error('Boom!');
});
```

Testez :

```bash
curl http://localhost:3000/error
```

✅ Regardez :

* logs Winston
* erreurs dans New Relic (APM → Errors)

---

## Bonus (si temps restant)

Ajoutez :

* niveau `debug`
* logs colorisés
* rotation de fichiers


## Questions de débrief

1. Pourquoi importer New Relic *avant tout le reste* ?
2. Pourquoi utiliser JSON pour les logs ?
3. Quelle limite au monitoring sans logs ?
4. Comment scaler ce système en production ?

## Variante (pour aller plus loin)

Ajouter Socket.io et monitorer les événements en temps réel.

