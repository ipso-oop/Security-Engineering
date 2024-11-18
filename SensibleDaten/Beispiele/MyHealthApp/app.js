const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const app = express();
const db = new sqlite3.Database(':memory:');

// Middleware Setup
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

// Mailer Setup (Dummy-Konfiguration für Demo)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'example@gmail.com',
    pass: 'password'
  }
});


// DB Setup mit unsicherer Passwortspeicherung und fehlender Zugriffskontrolle
db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT)");
  db.run("INSERT INTO users (username, password, email) VALUES ('admin', 'admin123', 'admin@example.com')");
  db.run("INSERT INTO users (username, password, email) VALUES ('user', 'userpass', 'user@example.com')");

  db.run("CREATE TABLE health_data (id INTEGER PRIMARY KEY, user_id INTEGER, data TEXT, category TEXT)");
  db.run("INSERT INTO health_data (user_id, data, category) VALUES (1, 'Admin health report', 'Befunde')");
  db.run("INSERT INTO health_data (user_id, data, category) VALUES (2, 'User health report', 'Medikation')");
  
  db.run("CREATE TABLE access_links (id INTEGER PRIMARY KEY, health_data_id INTEGER, access_code TEXT, expires_at DATETIME)");
});

// Startseite
app.get('/', (req, res) => {
  res.render('index');
});

// Registrierung
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', (req, res) => {
  const { username, password, email, phone } = req.body;
  db.run("INSERT INTO users (username, password, email, phone) VALUES (?, ?, ?, ?)", [username, password, email, phone], (err) => {
    if (err) return res.send('Registrierungsfehler');
    res.send('Registrierung erfolgreich');
  });
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`, (err, user) => {
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
  
  db.all("SELECT * FROM health_data WHERE user_id = ?", [userId], (err, healthData) => {
    res.render('dashboard', { healthData });
  });
});

// Hinzufügen von Gesundheitsdaten
app.post('/health_data/add', (req, res) => {
  const userId = req.cookies.user;
  const { data, category } = req.body;
  db.run("INSERT INTO health_data (user_id, data, category) VALUES (?, ?, ?)", [userId, data, category], (err) => {
    if (err) return res.send('Fehler beim Hinzufügen der Daten');
    res.send('Daten hinzugefügt');
  });
});

// Bearbeiten von Gesundheitsdaten
app.post('/health_data/edit', (req, res) => {
  const { id, data, category } = req.body;
  db.run("UPDATE health_data SET data = ?, category = ? WHERE id = ?", [data, category, id], (err) => {
    if (err) return res.send('Fehler beim Bearbeiten der Daten');
    res.send('Daten aktualisiert');
  });
});

// Löschen von Gesundheitsdaten
app.post('/health_data/delete', (req, res) => {
  const { id } = req.body;
  db.run("DELETE FROM health_data WHERE id = ?", [id], (err) => {
    if (err) return res.send('Fehler beim Löschen der Daten');
    res.send('Daten gelöscht');
  });
});

// Freigabe von Gesundheitsdaten
app.post('/health_data/share', (req, res) => {
  const { healthDataId } = req.body;
  const accessCode = Math.random().toString(36).substr(2, 8);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 Stunde gültig
  
  db.run("INSERT INTO access_links (health_data_id, access_code, expires_at) VALUES (?, ?, ?)", [healthDataId, accessCode, expiresAt], (err) => {
    if (err) return res.send('Fehler beim Erstellen des Freigabelinks');
    res.send(`Freigabelink erstellt. Zugangscode: ${accessCode}`);
  });
});

// Zugriff auf freigegebene Gesundheitsdaten
app.get('/health_data/access', (req, res) => {
  const { code } = req.query;
  db.get("SELECT * FROM access_links WHERE access_code = ? AND expires_at > ?", [code, new Date()], (err, link) => {
    if (!link) return res.send('Ungültiger oder abgelaufener Zugangscode');
    
    db.get("SELECT * FROM health_data WHERE id = ?", [link.health_data_id], (err, healthData) => {
      if (healthData) {
        res.json(healthData);
        sendAccessNotification(link.health_data_id); // Benachrichtigung
      } else {
        res.send('Gesundheitsdaten nicht gefunden');
      }
    });
  });
});

// Kommentarformular
app.get('/comment', (req, res) => {
  res.render('comment');
});

app.post('/comment', (req, res) => {
  const comment = req.body.comment;
  res.send(`Kommentar erhalten: ${comment}`);
});

// Benachrichtigung
function sendAccessNotification(healthDataId) {
  db.get("SELECT u.email FROM users u JOIN health_data h ON u.id = h.user_id WHERE h.id = ?", [healthDataId], (err, user) => {
    if (user) {
      transporter.sendMail({
        from: 'example@gmail.com',
        to: user.email,
        subject: 'Zugriff auf Gesundheitsdaten',
        text: `Ihre Gesundheitsdaten wurden abgerufen.`
      });
    }
  });
}

// Starten des Servers
app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});
