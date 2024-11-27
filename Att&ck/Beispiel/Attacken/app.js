const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const app = express();

// Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

// Datenbank (Unsicher konfiguriert)
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT)");
  db.run("CREATE TABLE data (id INTEGER PRIMARY KEY, user_id INTEGER, content TEXT)");
  db.run("CREATE TABLE shared_data (id INTEGER PRIMARY KEY, data_id INTEGER, access_code TEXT, expires_at DATETIME)");

  // Beispiel-Daten
  db.run("INSERT INTO users (username, password, email) VALUES ('admin', 'admin123', 'admin@example.com')");
  db.run("INSERT INTO users (username, password, email) VALUES ('user', 'password', 'user@example.com')");
});

// **Routes**

// Startseite
app.get('/', (req, res) => {
  res.send('<h1>Willkommen zur App</h1><a href="/login">Login</a> | <a href="/register">Registrieren</a>');
});

// Benutzer-Registrierung
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { username, password, email } = req.body;
  db.run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, password, email], (err) => {
    if (err) return res.status(500).send('Fehler bei der Registrierung');
    res.send('Registrierung erfolgreich');
  });
});

// Benutzer-Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(req.body.username);
  console.log(req.body.password);
  db.get(`SELECT * FROM users WHERE username = '${req.body.username}'`,(err, user) => {
	console.log(user);
    if (user) {
      res.cookie('user', user.id);
      res.redirect('/dashboard');
    } else {
      res.send('Login fehlgeschlagen');
    }
  });
});

// Dashboard
app.get('/dashboard', (req, res) => {
  const userId = req.cookies.user;
  if (!userId) return res.redirect('/login');

  db.all("SELECT * FROM data WHERE user_id = ?", [userId], (err, data) => {
    res.render('dashboard', { data });
  });
});

// Daten hinzufügen
app.post('/data/add', (req, res) => {
  const userId = req.cookies.user;
  const { content } = req.body;
  db.run("INSERT INTO data (user_id, content) VALUES (?, ?)", [userId, content], (err) => {
    if (err) return res.status(500).send('Fehler beim Hinzufügen der Daten');
    res.redirect('/dashboard');
  });
});

// Daten teilen
app.post('/data/share', (req, res) => {
  const { dataId } = req.body;
  const accessCode = crypto.randomBytes(4).toString('hex');
  const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 Stunde gültig
  db.run("INSERT INTO shared_data (data_id, access_code, expires_at) VALUES (?, ?, ?)", [dataId, accessCode, expiresAt], (err) => {
    if (err) return res.status(500).send('Fehler beim Teilen der Daten');
    res.send(`Daten geteilt. Zugangscode: ${accessCode}`);
  });
});

// Zugriff auf geteilte Daten
app.get('/data/access', (req, res) => {
  const { code } = req.query;
  db.get("SELECT * FROM shared_data WHERE access_code = ? AND expires_at > ?", [code, new Date()], (err, sharedData) => {
    if (!sharedData) return res.status(400).send('Ungültiger oder abgelaufener Zugangscode');

    db.get("SELECT * FROM data WHERE id = ?", [sharedData.data_id], (err, data) => {
      if (data) {
        res.json(data);
      } else {
        res.status(404).send('Daten nicht gefunden');
      }
    });
  });
});

// Starten des Servers
app.listen(3000, () => {
  console.log('App läuft auf http://localhost:3000');
});
