const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();

// HTTPS-Zertifikate
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

app.get('/', (req, res) => {
  res.send('Willkommen auf der HTTPS-gesicherten Seite!');
});

https.createServer(options, app).listen(3000, () => {
  console.log('Server läuft auf https://localhost:3000');
});
