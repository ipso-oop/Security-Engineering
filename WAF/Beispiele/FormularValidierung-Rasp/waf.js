const express = require('express');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Helmet: fügt Sicherheits-HTTP-Header hinzu
app.use(helmet());

// Body-Parser für JSON- und URL-kodierte Formulardaten
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware zur einfachen WAF-Funktionalität
function wafMiddleware(req, res, next) {
  const sqlInjectionPattern = /(\bSELECT\b|\bUNION\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b)/i;
  if (sqlInjectionPattern.test(req.url) || sqlInjectionPattern.test(JSON.stringify(req.body))) {
    console.log("SQL Injection Versuch erkannt und blockiert");
    return res.status(403).send("Verboten: Verdächtige Anfrage erkannt.");
  }

  const xssPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  if (xssPattern.test(JSON.stringify(req.query)) || xssPattern.test(JSON.stringify(req.body))) {
    console.log("XSS Versuch erkannt und blockiert");
    return res.status(403).send("Verboten: Verdächtige Anfrage erkannt.");
  }

  // Weiterleiten, wenn keine verdächtige Aktivität erkannt wurde
  next();
}

// WAF-Middleware anwenden
app.use(wafMiddleware);

// Proxy für Weiterleitung von Anfragen an http://localhost:8000
app.use('/proxy', createProxyMiddleware({
  target: 'http://localhost:8000',   // Zielserver, an den weitergeleitet wird
  changeOrigin: true,                // Ermöglicht Proxy für einen anderen Server
  pathRewrite: { '^/proxy': '' },    // Entfernt /proxy-Pfadteil bei der Weiterleitung
  onProxyReq: (proxyReq, req, res) => {
    // Falls der Body vorhanden ist und das POST ist, explizit als Body senden
    if (req.body && req.method === 'POST') {
      const bodyData = JSON.stringify(req.body);
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  }
}));


// Server auf Port 9000 starten
const PORT = 9000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
