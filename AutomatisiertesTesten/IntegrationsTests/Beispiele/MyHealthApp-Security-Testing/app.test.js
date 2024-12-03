const request = require('supertest');
const express = require('express');

const url = 'http://localhost:3000';

describe('Test Suite für die Anwendung - Security Testing', () => {
  
  //SQL-Injection verhindern:
  test('POST /login sollte SQL-Injection blockieren', async () => {
  const res = await request(url)
    .post('/login')
    .send({ username: "'OR 1='1''", password: "'OR 1='1''" });
   expect(res.statusCode).toBe(200);
    expect(res.text).toContain('Login fehlgeschlagen');
});

//CSRF-Schutz
test('POST /health_data/add sollte CSRF-Token validieren', async () => {
  const res = await request(url)
    .post('/health_data/share')
    .send({ data: 'Test', category: 'Test' });
  expect(res.statusCode).toBe(200); 
  expect(res.text).toContain('Fehler beim Erstellen des Freigabelinks');// Ohne Token abgelehnt
});


//Zugriffsrechte prüfen:
test('GET /dashboard sollte nur für eingeloggte Benutzer zugänglich sein', async () => {
  const res = await request(url).get('/dashboard');
    expect(res.statusCode).toBe(302); // Umleitung zum Login
    expect(res.text).toContain('Found. Redirecting to /login');
});


});
