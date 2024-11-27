const sqlite3 = require('sqlite3');
const crypto = require('crypto');

const db = new sqlite3.Database(':memory:');

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', 'encryptionkey');
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(text) {
  const decipher = crypto.createDecipher('aes-256-cbc', 'encryptionkey');
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

db.serialize(() => {
  db.run("CREATE TABLE sensitive_data (id INTEGER PRIMARY KEY, data TEXT)");
  const encrypted = encrypt('Sehr sensible Informationen');
  db.run("INSERT INTO sensitive_data (data) VALUES (?)", [encrypted]);

  db.get("SELECT * FROM sensitive_data WHERE id = 1", (err, row) => {
    console.log('Entschlüsselt:', decrypt(row.data));
  });
});
