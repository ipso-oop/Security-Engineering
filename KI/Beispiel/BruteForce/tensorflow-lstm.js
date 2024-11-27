const tf = require('@tensorflow/tfjs');

// Trainingsdaten
const trainingData = `
admin admin123
user password
test 123456
user1 user1234
user2 password2
root root123
guest guest
test1 test1234
admin2 admin234
user3 securePass
`;

// Zeichensatz extrahieren und Mapping erstellen
const chars = [...new Set(trainingData)];
const charToIndex = {};
const indexToChar = {};
chars.forEach((char, idx) => {
  charToIndex[char] = idx;
  indexToChar[idx] = char;
});

// Sequenzlänge definieren
const seqLength = 14;
const vocabSize = chars.length;

// Daten vorbereiten
function prepareData(text, seqLength) {
  const sequences = [];
  const targets = [];
  for (let i = 0; i < text.length - seqLength; i++) {
    const inputSeq = text.slice(i, i + seqLength);
    const targetChar = text[i + seqLength];
    sequences.push(inputSeq.split('').map(char => charToIndex[char]));
    targets.push(charToIndex[targetChar]);
  }
  const xs = tf.tensor2d(sequences);
  const ys = tf.tensor2d(targets.map(t => tf.oneHot(t, vocabSize).arraySync()));
  return { xs, ys };
}

const { xs, ys } = prepareData(trainingData, seqLength);

// Modell erstellen
async function trainModel() {
  const model = tf.sequential();
  model.add(tf.layers.embedding({ inputDim: vocabSize, outputDim: 64, inputLength: seqLength }));
  model.add(tf.layers.lstm({ units: 128, returnSequences: false }));
  model.add(tf.layers.dense({ units: vocabSize, activation: 'softmax' }));

  model.compile({ optimizer: 'adam', loss: 'categoricalCrossentropy' });

  console.log('Trainiere Modell...');
  await model.fit(xs, ys, {
    epochs: 100,
    batchSize: 32,
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
function generateText(model, startString, length = 100) {
  let inputSeq = startString.slice(0, seqLength).split('').map(char => charToIndex[char]);
  let generatedText = startString;

  for (let i = 0; i < length; i++) {
    const inputTensor = tf.tensor2d([inputSeq], [1, seqLength]);
    const predictions = model.predict(inputTensor).arraySync()[0];
    const predictedIndex = tf.argMax(predictions).arraySync();
    const predictedChar = indexToChar[predictedIndex];

    generatedText += predictedChar;

    inputSeq = [...inputSeq.slice(1), predictedIndex];
  }

  return generatedText;
}

// Hauptfunktion
async function main() {
  const model = await trainModel();
  const startString = 'admin admin123';
  const generated = generateText(model, startString, 100);
  console.log(`Generierter Text:\n${generated}`);
}

main();
