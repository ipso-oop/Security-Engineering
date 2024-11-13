import express from 'express';
import httpProxy from 'http-proxy';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import xss from 'xss';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const proxy = httpProxy.createProxyServer();
const port = 4000;
const targetUrl = 'http://localhost:3000';

// Rate Limiter Setup (Gegen Brute Force)
const rateLimiter = new RateLimiterMemory({
  points: 10, // Anzahl der Requests
  duration: 1, // Pro Sekunde
});

// Security Headers
app.use(helmet());
app.use(express.json({ limit: '10kb' })); // Limitiert Request-Größe

// Middleware für Request Logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// OWASP Top 10 Schutzmaßnahmen
const securityMiddleware = {
  // 1. Broken Access Control
  validateToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },

  // 2. Cryptographic Failures
  enforceHTTPS: (req, res, next) => {
    if (!req.secure && process.env.NODE_ENV === 'production') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  },

  // 3. Injection Prevention
  sanitizeInput: (req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key]);
        }
      });
    }
    next();
  },

  // 4. Insecure Design
  validateRequestSchema: (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },

  // 5. Security Misconfiguration
  validateHeaders: (req, res, next) => {
    const bannedHeaders = ['x-powered-by', 'server'];
    bannedHeaders.forEach(header => res.removeHeader(header));
    next();
  },

  // 6. Vulnerable Components
  validateContentType: (req, res, next) => {
    if (req.method !== 'GET' && !req.is('application/json')) {
      return res.status(415).json({ error: 'Unsupported Media Type' });
    }
    next();
  },

  // 7. Authentication Failures
  rateLimit: async (req, res, next) => {
    try {
      await rateLimiter.consume(req.ip);
      next();
    } catch {
      res.status(429).json({ error: 'Too Many Requests' });
    }
  },

  // 8. Software and Data Integrity
  validateIntegrity: (req, res, next) => {
    const contentHash = req.headers['content-hash'];
    if (req.method === 'POST' && !contentHash) {
      return res.status(400).json({ error: 'Content hash required' });
    }
    next();
  },

  // 9. Security Logging
  logSecurity: (req, res, next) => {
    const securityLog = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body
    };
    console.log('Security Log:', JSON.stringify(securityLog));
    next();
  },

  // 10. SSRF Prevention
  validateUrl: (req, res, next) => {
    const url = req.query.url || req.body.url;
    if (url) {
      try {
        const urlObj = new URL(url);
        const allowedHosts = ['localhost', '127.0.0.1'];
        if (!allowedHosts.includes(urlObj.hostname)) {
          return res.status(403).json({ error: 'URL not allowed' });
        }
      } catch {
        return res.status(400).json({ error: 'Invalid URL' });
      }
    }
    next();
  }
};

// Alle Middleware anwenden
app.use(securityMiddleware.enforceHTTPS);
app.use(securityMiddleware.rateLimit);
app.use(securityMiddleware.validateHeaders);
app.use(securityMiddleware.logSecurity);
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.validateContentType);
app.use(securityMiddleware.validateUrl);

// Proxy Request Handler
app.use('*', (req, res) => {
  proxy.web(req, res, { 
    target: targetUrl,
    changeOrigin: true
  }, (err) => {
    console.error('Proxy Error:', err);
    res.status(500).json({ error: 'Proxy Error' });
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(port, () => {
  console.log(`WAF running on port ${port}`);
  console.log(`Proxying requests to ${targetUrl}`);
});