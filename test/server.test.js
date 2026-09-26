const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const { startServer } = require('../server.js');
const bookingHandler = require('../api/booking.js');

let server;

test('Vercel booking API accepts booking details and returns success', async () => {
  const req = {
    method: 'POST',
    url: '/api/booking',
    headers: { 'content-type': 'application/json' },
    body: {
      name: 'Aman Singh',
      phone: '+91 96536 55800',
      bookingType: 'Airport Pickup',
      car: 'Swift Dzire',
      pickup: 'Chandigarh Airport',
      destination: 'Kharar',
      date: '2026-09-29',
      time: '18:30',
      message: 'Need a family-friendly ride.'
    }
  };

  const response = {
    statusCode: 200,
    headers: {},
    body: '',
    setHeader(name, value) { this.headers[name] = value; },
    writeHead(status, headers) {
      this.statusCode = status;
      this.headers = { ...this.headers, ...headers };
    },
    end(payload) {
      this.body = payload ?? '';
    }
  };

  await bookingHandler(req, response);
  const result = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(result.success, true);
  assert.equal(result.booking.name, 'Aman Singh');
});

test('Vercel mode falls back to memory storage when disk writes are blocked', async () => {
  const previousValue = process.env.VERCEL;
  process.env.VERCEL = '1';
  const originalWriteFile = fs.writeFile;
  const originalReadFile = fs.readFile;

  fs.writeFile = async () => {
    throw new Error('Disk write blocked in Vercel');
  };
  fs.readFile = async () => {
    throw new Error('Disk read blocked in Vercel');
  };

  try {
    const bookings = await require('../server.js').readBookings();
    assert.deepEqual(bookings, []);

    await require('../server.js').saveBookings([{ id: 'memory-test' }]);
    const reloaded = await require('../server.js').readBookings();
    assert.equal(reloaded[0].id, 'memory-test');
  } finally {
    process.env.VERCEL = previousValue;
    fs.writeFile = originalWriteFile;
    fs.readFile = originalReadFile;
  }
});

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
