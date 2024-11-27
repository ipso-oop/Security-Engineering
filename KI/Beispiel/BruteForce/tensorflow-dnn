const tf = require('@tensorflow/tfjs');

// Trainingsdaten
const trainingData = [
  { username: 'admin', password: 'admin123' },
  { username: 'user', password: 'password' },
  { username: 'test', password: '123456' },
  { username: 'user1', password: 'user1234' },
  { username: 'user2', password: 'password2' },
  { username: 'root', password: 'root123' },
  { username: 'guest', password: 'guest' },
  { username: 'test1', password: 'test1234' },
  { username: 'admin2', password: 'admin234' },
  { username: 'user3', password: 'securePass' },
];


// Codierungs- und Decodierungsfunktionen
function encodeString(str, maxLength) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const encoded = Array(maxLength).fill(0);
  for (let i = 0; i < str.length; i++) {
    const charIndex = chars.indexOf(str[i]);
    encoded[i] = charIndex !== -1 ? charIndex / chars.length : 0;
  }
  return encoded;
}

function decodeVector(vector) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return vector
    .map(val => chars[Math.round(val * chars.length)] || '')
    .join('')
    .replace(/\0/g, '');
}


// Max-Längen für Padding
const maxInputLength = Math.max(...trainingData.map(data => data.username.length));
const maxOutputLength = Math.max(...trainingData.map(data => data.password.length));

// Daten vorbereiten
const xs = tf.tensor2d(trainingData.map(data => encodeString(data.username, maxInputLength)));
const ys = tf.tensor2d(trainingData.map(data => encodeString(data.password, maxOutputLength)));

// Modell erstellen
async function trainModel() {
  const model = tf.sequential();
model.add(tf.layers.dense({ inputShape: [maxInputLength], units: 64, activation: 'relu' }));
model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
model.add(tf.layers.dense({ units: maxOutputLength, activation: 'sigmoid' }));

  model.compile({ optimizer: 'adam', loss: 'meanSquaredError' });


  console.log('Trainiere Modell...');
 await model.fit(xs, ys, {
  epochs: 3000,
  batchSize: 4,
  callbacks: {
    onEpochEnd: async (epoch, logs) => {
      console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss}`);
    },
  },
});


  console.log('Modelltraining abgeschlossen.');
  return model;
}

// Vorhersage durchführen
async function predictPasswords(model) {
  for (const data of trainingData) {
    const input = tf.tensor2d([encodeString(data.username, maxInputLength)]);
    const prediction = model.predict(input);
	//console.log('Vorhersagerohdaten:', prediction.arraySync().flat());
    const decodedPassword = decodeVector(prediction.arraySync().flat());
    console.log(`Benutzer: ${data.username}, Vorhergesagtes Passwort: ${decodedPassword}`);

  }
}

// Hauptfunktion
async function main() {
  const model = await trainModel();
  await predictPasswords(model);
}

main();
