const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { promisify } = require('util');
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

// Wrapper für Promisify, um async/await mit SQLite3 zu nutzen
const runAsync = promisify(db.run.bind(db));

(async () => {
  try {
    // Tabelle für Benutzer erstellen
    await runAsync(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      )
    `);

    // Beispielbenutzer hinzufügen
    const adminPassword = await bcrypt.hash('admin123', 10);
	console.log(adminPassword);
    const userPassword = await bcrypt.hash('userpass', 10);
	console.log(userPassword);

    await runAsync(
      `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
      ['admin', adminPassword, 'admin@example.com']
    );
    await runAsync(
      `INSERT INTO users (username, password, email) VALUES (?, ?, ?)`,
      ['user', userPassword, 'user@example.com']
    );

    // Tabelle für Gesundheitsdaten erstellen
    await runAsync(`
      CREATE TABLE health_data (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        category TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      )
    `);

    // Beispiel-Gesundheitsdaten hinzufügen
    await runAsync(
      `INSERT INTO health_data (user_id, data, category) VALUES (?, ?, ?)`,
      [1, 'Admin health report', 'Befunde']
    );
    await runAsync(
      `INSERT INTO health_data (user_id, data, category) VALUES (?, ?, ?)`,
      [2, 'User health report', 'Medikation']
    );

    // Tabelle für Zugriffscodes erstellen
    await runAsync(`
      CREATE TABLE access_links (
        id INTEGER PRIMARY KEY,
        health_data_id INTEGER NOT NULL,
        access_code TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (health_data_id) REFERENCES health_data (id) ON DELETE CASCADE
      )
    `);

    console.log('Datenbank erfolgreich eingerichtet');
  } catch (error) {
    console.error('Fehler beim Einrichten der Datenbank:', error);
  }
})();
// Startseite
app.get('/', (req, res) => {
  res.render('index');
});

// Registrierung
app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  db.run("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", [username, hashedPassword, email], (err) => {
    if (err) return res.status(500).send('Fehler bei der Registrierung');
    res.redirect('/login');
  });
});

// Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log(req.body.username);
  console.log(req.body.password);
  db.get(`SELECT * FROM users WHERE username = '${req.body.username}'`,(err, user) => {
	console.log(user);
	if(user){
	const match = bcrypt.compareSync(req.body.password, user.password);
    if (match) {
      res.cookie('user', user.id);
      res.redirect('/dashboard');
    } else {
      res.send('Login fehlgeschlagen');
	}
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
app.listen(3000,() => {
  console.log('Server läuft auf http://localhost:3000');
});
