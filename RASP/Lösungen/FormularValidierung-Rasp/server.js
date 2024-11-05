const express = require('express');
const path = require('path');
const { body, validationResult } = require('express-validator');
const bodyParser = require('body-parser');
const helmet = require('helmet');

const app = express();

//RASP Tool Helmet
app.use(helmet());


// Middleware für statische Dateien (CSS, HTML)
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware für das Verarbeiten von Formularen
app.use(bodyParser.urlencoded({ extended: true }));

// Route für GET-Anfragen (zeigt das Formular an)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'static/html/index.html'));
});

// Route für POST-Anfragen mit Validierung und Rückgabe der Fehler
app.post('/', [
    body('firstname').notEmpty().withMessage('Vorname darf nicht leer sein'),
    body('lastname').notEmpty().withMessage('Nachname darf nicht leer sein'),
    body('email').isEmail().withMessage('Bitte geben Sie eine gültige E-Mail-Adresse ein.'),
    body('phone').optional().isMobilePhone().withMessage('Bitte geben Sie eine gültige Telefonnummer ein.'),
    body('message').notEmpty().withMessage('Nachricht darf nicht leer sein')
], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Wenn es Fehler gibt, sende das Formular mit den Fehlern zurück
        const errorMessages = errors.array().map(err => `<span class="error">${err.msg}</span>`).join('<br>');

        return res.status(400).send(`
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <title>Formular mit Grid Layout - Fehler</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4; }
                    form { display: grid; grid-template-columns: 1fr 2fr; grid-gap: 5px; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fff; border: 1px solid #ccc; border-radius: 10px; }
                    label { text-align: left; margin: 10px; padding-right: 10px; grid-column: 1 / 2; align-self: center; }
                    input[type="text"], input[type="email"], textarea { margin: 10px; padding: 10px; border: 1px solid #ccc; border-radius: 3px; grid-column: 2 / 3; }
                    button { grid-column: 1 / 3; margin: 10px; padding: 10px; background-color: #28a745; color: white; border: none; border-radius: 3px; cursor: pointer; }
                    .error { color: red; grid-column: 2 / 3; margin: 5px; padding: 10px; }
                </style>
            </head>
            <body>

            <form class="form-container" action="/" method="POST">
                <label for="firstname">Vorname:</label>
                <input type="text" id="firstname" name="firstname" value="${req.body.firstname || ''}">
                ${errors.array().find(e => e.param === 'firstname') ? `<span class="error">${errors.array().find(e => e.param === 'firstname').msg}</span>` : ''}

                <label for="lastname">Nachname:</label>
                <input type="text" id="lastname" name="lastname" value="${req.body.lastname || ''}">
                ${errors.array().find(e => e.param === 'lastname') ? `<span class="error">${errors.array().find(e => e.param === 'lastname').msg}</span>` : ''}

                <label for="email">E-Mail:</label>
                <input type="email" id="email" name="email" value="${req.body.email || ''}">
                ${errors.array().find(e => e.param === 'email') ? `<span class="error">${errors.array().find(e => e.param === 'email').msg}</span>` : ''}

                <label for="phone">Telefonnummer:</label>
                <input type="text" id="phone" name="phone" value="${req.body.phone || ''}">
                ${errors.array().find(e => e.param === 'phone') ? `<span class="error">${errors.array().find(e => e.param === 'phone').msg}</span>` : ''}

                <label for="message">Nachricht:</label>
                <textarea id="message" name="message">${req.body.message || ''}</textarea>
                ${errors.array().find(e => e.param === 'message') ? `<span class="error">${errors.array().find(e => e.param === 'message').msg}</span>` : ''}

                <button type="submit">Absenden</button>
            </form>

            </body>
            </html>
        `);
    }

    // Wenn alles korrekt ist, wird die Erfolgsmeldung angezeigt
    res.send(`
        <html lang="de">
        <head><title>Formularergebnisse</title></head>
        <body>
            <h1>Formular Eingaben</h1>
            <p>Vorname: ${req.body.firstname}</p>
            <p>Nachname: ${req.body.lastname}</p>
            <p>E-Mail: ${req.body.email}</p>
            <p>Telefonnummer: ${req.body.phone || 'Keine Telefonnummer angegeben'}</p>
            <p>Nachricht: ${req.body.message}</p>
            <a href="/">Zurück zum Formular</a>
        </body>
        </html>
    `);
});

// Server starten
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
});
