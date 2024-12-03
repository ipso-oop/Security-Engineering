const request = require('supertest');
const express = require('express');

const url = 'http://localhost:3000';

describe('Test Suite für die Anwendung', () => {
  
// Test für die Startseite
  test('GET / sollte die Startseite anzeigen', async () => {
    const res = await request(url).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Willkommen zur App');
	});
  // Test für die Registrierung
  test('POST /register sollte einen neuen Benutzer registrieren', async () => {
    const newUser = { username: 'testuser', password: 'testpass', email: 'test@example.com' };
    const res = await request(url).post('/register').send(newUser);
    expect(res.statusCode).toBe(302); // Umleitung zum Login
  });

  // Test für den Login
  test('POST /login sollte einen Benutzer erfolgreich einloggen', async () => {
    const credentials = { username: 'admin', password: 'admin123' };
    const res = await request(url).post('/login').send(credentials);
    expect(res.statusCode).toBe(302); // Umleitung zum Dashboard
  });

  // Test für fehlgeschlagenen Login
  test('POST /login sollte Login ablehnen, wenn ungültige Daten eingegeben werden', async () => {
    const credentials = { username: 'invaliduser', password: 'invalidpass' };
    const res = await request(url).post('/login').send(credentials);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Login fehlgeschlagen');
  });

  // Test für Dashboard-Zugriff
  test('GET /dashboard sollte Dashboard-Daten zurückgeben, wenn Benutzer eingeloggt ist', async () => {
    const agent = request.agent(url);

    // Logge Benutzer ein
    await agent.post('/login').send({ username: 'admin', password: 'admin123' });

    // Greife auf Dashboard zu
    const res = await agent.get('/dashboard');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Admin health report');
  });

  // Test für Hinzufügen von Gesundheitsdaten
  test('POST /health_data/add sollte neue Gesundheitsdaten hinzufügen', async () => {
    const agent = request.agent(url);

    // Logge Benutzer ein
    await agent.post('/login').send({ username: 'admin', password: 'admin123' });

    // Füge Daten hinzu
    const newHealthData = { data: 'Neue Gesundheitsdaten', category: 'Test' };
    const res = await agent.post('/health_data/add').send(newHealthData);
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Daten hinzugefügt');
  });

  // Test für das Teilen von Daten
  test('POST /health_data/share sollte einen Freigabelink generieren', async () => {
    const agent = request.agent(url);

    // Logge Benutzer ein
    await agent.post('/login').send({ username: 'admin', password: 'admin123' });

    // Teile Daten
    const res = await agent.post('/health_data/share').send({ healthDataId: 1 });
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Zugangscode');
	console.log(res.text);
  });

  // Test für Zugriff auf geteilte Daten
  test('GET /health_data/access sollte geteilte Daten zurückgeben', async () => {
    const res = await request(url).get('/health_data/access?code=valid_code');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
  });

  // Test für die Kommentarfunktion
  test('POST /comment sollte einen Kommentar zurückgeben', async () => {
    const res = await request(url).post('/comment').send({ comment: 'Testkommentar' });
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Kommentar erhalten');
  });


  });
