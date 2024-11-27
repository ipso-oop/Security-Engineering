db.serialize(() => {
  db.run("CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, password TEXT)");
  const emailEncrypted = encrypt('user@example.com');
  db.run("INSERT INTO users (email, password) VALUES (?, ?)", [emailEncrypted, 'hashed_password']);

  db.get("SELECT * FROM users WHERE id = 1", (err, row) => {
    console.log('Entschlüsselte Email:', decrypt(row.email));
  });
});
