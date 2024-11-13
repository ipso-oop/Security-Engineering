import express from 'express';
import sqlite3 from 'sqlite3';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios'

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const db = new sqlite3.Database(':memory:');

// Absichtlich unsichere Konfiguration
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

// DB Setup mit unsicherer Struktur
db.serialize(() => {
  db.run("CREATE TABLE users (username TEXT, password TEXT, isAdmin INTEGER)");
  db.run("INSERT INTO users VALUES ('admin', 'admin123', 1)");
  db.run("INSERT INTO users VALUES ('Roman', '1234', 0)");
  db.run("CREATE TABLE posts (title TEXT, content TEXT, user TEXT)");
  db.run("INSERT INTO posts VALUES ('Hallo Welt', 'Make IT greater', 'Roman')");
});

// 1. Broken Access Control - Keine Zugriffskontrollen
app.get('/admin', (req, res) => {
  db.all("SELECT * FROM users", (err, users) => {
    res.render('admin', { users });
  });
});

// 2. Cryptographic Failures - Passwörter im Klartext
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(
    "SELECT * FROM users WHERE username = ? AND password = ?",
    [username, password],
    (err, user) => {
      if (user) {
        res.cookie('user', username);
        res.redirect('/dashboard');
      } else {
        res.redirect('/login');
      }
    }
  );
});

// 3. Injection - SQL Injection möglich
app.get('/search', (req, res) => {
  const query = req.query.q;
  db.all(
    "SELECT * FROM users WHERE username LIKE '%" + query + "%'",
    (err, users, query) => {
      res.render('search', { users, query });
    }
  );
});

// 4. Insecure Design - Keine Rate Limiting
app.post('/reset-password', (req, res) => {
  const { email } = req.body;
  res.send('Password reset link sent');
});

// 5. Security Misconfiguration - Fehler-Stack-Traces
app.get('/debug', (req, res) => {
  throw new Error('Debug error page');
});

// 6. Vulnerable Components - Veraltete Komponenten verwendet
app.get('/markdown', (req, res) => {
  res.render('markdown', { content: req.query.content });
});

// 7. Auth Failures - Schwache Passwortanforderungen
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(
    "INSERT INTO users (username, password, isAdmin) VALUES (?, ?, 0)",
    [username, password]
  );
  res.redirect('/login');
});

// 8. Software Integrity - Keine Integritätsprüfung
app.post('/upload', (req, res) => {
  res.send('File uploaded');
});

// 9. Logging Failures - Keine Sicherheitsrelevante Logs
app.get('/transfer', (req, res) => {
  const { amount, to } = req.query;
  res.send(`Transferred ${amount} to ${to}`);
});

// 10. SSRF - Keine URL-Validierung
app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  
  try {
    // Anfrage an die angegebene URL senden
    const response = await axios.get(url);
    
    // Antwortinhalt zurücksenden
    res.send(response.data);
  } catch (error) {
    // Fehlerbehandlung für den Fall, dass die Anfrage fehlschlägt
    res.status(500).send('Fehler beim Abrufen der URL');
  }
});

// Basis-Routes
app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { user: req.cookies.user });
});

app.listen(3000, () => {
  console.log('Vulnerable app running on http://localhost:3000');
});