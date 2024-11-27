const fs = require('fs');

function auditAction(userId, action) {
  const auditLog = `[${new Date().toISOString()}] USER: ${userId} ACTION: ${action}\n`;
  fs.appendFileSync('audit.log', auditLog);
}

auditAction(1, 'Gesundheitsdaten abgerufen');
auditAction(2, 'Datenbankeintrag hinzugefügt');
