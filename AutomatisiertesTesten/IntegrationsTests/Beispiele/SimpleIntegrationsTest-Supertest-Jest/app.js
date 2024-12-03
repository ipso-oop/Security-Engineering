const express = require('express');

const app = express();

app.get('/user', function(req, res) {
  res.status(200).json({ name: 'john' });
});

// Starten des Servers
app.listen(3000,() => {
  console.log('Server läuft auf http://localhost:3000');
});
