const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3');
const cookieParser = require('cookie-parser');
const app = express();
const db = new sqlite3.Database(':memory:');

// Middleware für Body Parsing und Templating
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.set('view engine', 'ejs');

/// DB Setup mit unsicherer Struktur
db.serialize(() => {
  db.run("CREATE TABLE users (username TEXT, password TEXT, isAdmin INTEGER)");
  db.run("INSERT INTO users VALUES ('admin', 'admin123', 1)");
  db.run("INSERT INTO users VALUES ('Roman', '1234', 0)");
  db.run("CREATE TABLE posts (title TEXT, content TEXT, user TEXT)");
  db.run("INSERT INTO posts VALUES ('Hallo Welt', 'Make IT greater', 'Roman')");
  db.run("CREATE TABLE products (name TEXT, description TEXT)");
  db.run("INSERT INTO products VALUES ('Artikel 1', 'Beschreibung Artikel 1')");
  db.run("INSERT INTO products VALUES ('Artikel 2', 'Beschreibung Artikel 2')");
});


// Startseite
app.get('/', (req, res) => {
  res.render('index');
});

// Unsichere SQL-Injection in der Produktsuche
app.get('/search', (req, res) => {
  const query = req.query.q;
  db.all(
    "SELECT * FROM products WHERE name LIKE '%" + query + "%'",
    (err, products, query) => {
      res.render('search', { products, query });
    }
  );
});


// Unsicherer XSS-Endpunkt in den Benutzerkommentaren
app.get('/comment', (req, res) => {
  res.render('comment');
});

app.post('/comment', (req, res) => {
  const comment = req.body.comment; // Direkte Einbindung des Kommentars ohne Escape
  res.send(`Kommentar erhalten: ${comment}`); // XSS-Schwachstelle
});

// Unsichere Deserialisierung für den Benutzer-Login
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/dashboard', (req, res) => {
  res.render('dashboard', { user: req.cookies.user });
});


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


// Starten des Servers
app.listen(3000, () => {
  console.log('Server läuft auf http://localhost:3000');
});
