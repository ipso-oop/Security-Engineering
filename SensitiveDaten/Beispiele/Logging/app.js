const fs = require('fs');

function logEvent(event) {
  const log = `[${new Date().toISOString()}] EVENT: ${event}\n`;
  fs.appendFileSync('server.log', log);
}

logEvent('Server gestartet');
logEvent('Benutzer hat sich eingeloggt');
