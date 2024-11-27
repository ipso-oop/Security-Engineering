const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sqlite3 = require('sqlite3');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();

// Verschlüsselungskonfiguration
const algorithm = 'aes-192-cbc';
const password = 'Password used to generate key';
const key = crypto.scryptSync(password, 'salt', 24);
const iv = Buffer.alloc(16, 0); // Initialization vector

// Middleware-Setup
app.use(cookieParser());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(csrf({ cookie: true }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten
  max: 100,
  message: 'Zu viele Anfragen, bitte versuchen Sie es später erneut.',
}));
app.set('view engine', 'ejs');

// Datenbank einrichten
const db = new sqlite3.Database(':memory:');
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT)");
  db.run("CREATE TABLE data (id INTEGER PRIMARY KEY, user_id INTEGER, content TEXT)");
  db.run("CREATE TABLE shared_data (id INTEGER PRIMARY KEY, data_id INTEGER, access_code TEXT, expires_at DATETIME)");

  const hashedPassword = bcrypt.hashSync('admin123', 10);
  db.run("INSERT INTO users (username, password, email) VALUES ('admin', ?, 'admin@example.com')", [hashedPassword]);
});

// Hilfsfunktionen
function encryptData(data) {
  if (!data) return null;
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decryptData(encrypted) {
  if (!encrypted) return null;
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function addCsrfToken(req, res, next) {
  res.locals.csrfToken = req.csrfToken();
  next();
}

// Fehlerbehandlung
function handleErrors(err, req, res, next) {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send('Ungültiges CSRF-Token');
  }
  next(err);
}

// Routen
app.get('/', (req, res) => {
  res.send('<h1>Willkommen zur App</h1><a href="/login">Login</a> | <a href="/register">Registrieren</a>');
});

app.get('/register', addCsrfToken, (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, hashedPassword, email], (err) => {
    if (err) return res.status(500).send('Fehler bei der Registrierung');
    res.send('Registrierung erfolgreich');
  });
});

app.get('/login', addCsrfToken, (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.send('Login fehlgeschlagen');
    }
    res.cookie('user', user.id);
    res.redirect('/dashboard');
  });
});

app.get('/dashboard', addCsrfToken, (req, res) => {
  const userId = req.cookies.user;
  if (!userId) return res.redirect('/login');

  db.all("SELECT * FROM data WHERE user_id = ?", [userId], (err, data) => {
    if (err) return res.status(500).send('Datenbankfehler');

    const decryptedData = data.map(row => ({
      ...row,
      content: row.content ? decryptData(row.content) : null,
    }));

    res.render('dashboard', { data: decryptedData });
  });
});

app.post('/data/add', (req, res) => {
  const userId = req.cookies.user;
  const encryptedContent = encryptData(req.body.content);
  db.run("INSERT INTO data (user_id, content) VALUES (?, ?)", [userId, encryptedContent], (err) => {
    if (err) return res.status(500).send('Fehler beim Hinzufügen der Daten');
    res.redirect('/dashboard');
  });
});

app.post('/data/share', (req, res) => {
  const { dataId } = req.body;
  const accessCode = crypto.randomBytes(4).toString('hex');
  const expiresAt = new Date(Date.now() + 3600 * 1000); // 1 Stunde gültig
  db.run("INSERT INTO shared_data (data_id, access_code, expires_at) VALUES (?, ?, ?)", [dataId, accessCode, expiresAt], (err) => {
    if (err) return res.status(500).send('Fehler beim Teilen der Daten');
    res.send(`Daten geteilt. Zugangscode: ${accessCode}`);
  });
});

app.get('/data/access', (req, res) => {
  const { code } = req.query;
  db.get("SELECT * FROM shared_data WHERE access_code = ? AND expires_at > ?", [code, new Date()], (err, sharedData) => {
    if (!sharedData) return res.status(400).send('Ungültiger oder abgelaufener Zugangscode');

    db.get("SELECT * FROM data WHERE id = ?", [sharedData.data_id], (err, data) => {
      if (!data) return res.status(404).send('Daten nicht gefunden');

      data.content = decryptData(data.content);
      res.json(data);
    });
  });
});

// Fehlerbehandlung
app.use(handleErrors);

// Server starten
app.listen(3000, () => {
  console.log('App läuft auf http://localhost:3000');
});
