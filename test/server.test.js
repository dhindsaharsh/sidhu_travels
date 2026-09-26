const test = require('node:test');
const assert = require('node:assert/strict');
const { startServer } = require('../server.js');

let server;

test('POST /api/booking accepts booking details and returns success', async (t) => {
  server = await startServer(0);

  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  const address = server.address();
  const booking = {
    name: 'Aman Singh',
    phone: '+91 96536 55800',
    bookingType: 'Airport Pickup',
    car: 'Swift Dzire',
    pickup: 'Chandigarh Airport',
    destination: 'Kharar',
    date: '2026-09-29',
    time: '18:30',
    message: 'Need a family-friendly ride.'
  };

  const response = await fetch(`http://127.0.0.1:${address.port}/api/booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking),
  });

  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.booking.name, booking.name);
  assert.equal(result.booking.phone, booking.phone);
});
