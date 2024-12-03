const request = require('supertest');
const express = require('express');

const url = 'http://localhost:3000';

describe('Test Suite für die Anwendung', () => {
  
// Test für User Endpunkt
  test('GET / Tests User Endpoint', async () => {
    const res = await request(url).get('/user');
    expect(res.statusCode).toBe(200);
	});


  });
