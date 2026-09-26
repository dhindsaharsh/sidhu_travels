const http = require('http');
const fs = require('fs/promises');
const path = require('path');
const { URL } = require('url');

const PORT = Number(process.env.PORT) || 3000;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function getInMemoryBookings() {
  if (!globalThis.__SIDHU_TRAVELS_BOOKINGS__) {
    globalThis.__SIDHU_TRAVELS_BOOKINGS__ = [];
  }
  return globalThis.__SIDHU_TRAVELS_BOOKINGS__;
}

async function ensureStorage() {
  if (process.env.VERCEL) {
    getInMemoryBookings();
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(BOOKINGS_FILE);
  } catch {
    await fs.writeFile(BOOKINGS_FILE, '[]', 'utf8');
  }
}

async function readBookings() {
  if (process.env.VERCEL) {
    return [...getInMemoryBookings()];
  }

  try {
    const raw = await fs.readFile(BOOKINGS_FILE, 'utf8');
    try {
      return JSON.parse(raw || '[]');
    } catch {
      return [];
    }
  } catch {
    return [...getInMemoryBookings()];
  }
}

async function saveBookings(bookings) {
  if (process.env.VERCEL) {
    globalThis.__SIDHU_TRAVELS_BOOKINGS__ = Array.isArray(bookings) ? bookings : [];
    return;
  }

  try {
    await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf8');
  } catch {
    globalThis.__SIDHU_TRAVELS_BOOKINGS__ = Array.isArray(bookings) ? bookings : [];
  }
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  if (req.body !== undefined) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || !raw.trim()) {
      return Promise.resolve({});
    }

    try {
      return Promise.resolve(JSON.parse(raw));
    } catch {
      return Promise.reject(new Error('Invalid JSON body.'));
    }
  }

  return new Promise((resolve, reject) => {
    let raw = '';

    req.on('data', (chunk) => {
      raw += chunk;
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body.'));
      }
    });

    req.on('error', reject);
  });
}

async function handleBooking(req, res) {
  try {
    const body = await parseJsonBody(req);
    const required = ['name', 'phone', 'bookingType', 'pickup', 'destination', 'date', 'time'];

    const missingField = required.find((field) => !String(body[field] || '').trim());
    if (missingField) {
      sendJson(res, 400, {
        success: false,
        message: `Please enter a valid ${missingField}.`
      });
      return;
    }

    const booking = {
      id: `booking-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: String(body.name).trim(),
      phone: String(body.phone).trim(),
      bookingType: String(body.bookingType || 'Car Booking').trim(),
      car: String(body.car || 'Not Selected').trim(),
      pickup: String(body.pickup).trim(),
      destination: String(body.destination).trim(),
      date: String(body.date).trim(),
      time: String(body.time).trim(),
      message: String(body.message || '').trim(),
      createdAt: new Date().toISOString()
    };

    const bookings = await readBookings();
    bookings.push(booking);
    await saveBookings(bookings);

    sendJson(res, 200, {
      success: true,
      message: 'Booking request received successfully.',
      booking
    });
  } catch (error) {
    sendJson(res, 400, {
      success: false,
      message: error.message || 'Unable to submit booking.'
    });
  }
}

async function serveStaticFile(req, res, requestPath) {
  const safeName = requestPath === '/' ? '/index.html' : requestPath;
  const resolvedPath = path.normalize(path.join(ROOT_DIR, safeName));

  if (!resolvedPath.startsWith(ROOT_DIR)) {
    sendJson(res, 403, { success: false, message: 'Forbidden' });
    return;
  }

  try {
    const file = await fs.readFile(resolvedPath);
    const extension = path.extname(resolvedPath).toLowerCase();
    const contentType = MIME_TYPES[extension] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(file);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

function normalizeApiPath(pathname) {
  if (pathname === '/health' || pathname === '/api/health') return '/api/health';
  if (pathname === '/bookings' || pathname === '/api/bookings') return '/api/bookings';
  if (pathname === '/booking' || pathname === '/api/booking') return '/api/booking';
  return pathname;
}

async function handleRequest(req, res) {
  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = normalizeApiPath(decodeURIComponent(requestUrl.pathname));

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  if (pathname === '/api/health') {
    sendJson(res, 200, {
      status: 'ok',
      service: 'Sidhu Travels API',
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (pathname === '/api/bookings' && req.method === 'GET') {
    const bookings = await readBookings();
    sendJson(res, 200, { success: true, bookings });
    return;
  }

  if (pathname === '/api/booking' && req.method === 'POST') {
    await handleBooking(req, res);
    return;
  }

  if (pathname.startsWith('/api/')) {
    sendJson(res, 404, { success: false, message: 'API route not found.' });
    return;
  }

  await serveStaticFile(req, res, pathname);
}

async function handler(req, res) {
  try {
    await handleRequest(req, res);
  } catch (error) {
    console.error('Server error:', error);
    sendJson(res, 500, { success: false, message: 'Internal server error.' });
  }
}

function createApp() {
  return http.createServer((req, res) => {
    handler(req, res).catch((error) => {
      console.error('Server error:', error);
      sendJson(res, 500, { success: false, message: 'Internal server error.' });
    });
  });
}

async function startServer(port = PORT) {
  await ensureStorage();
  const server = createApp();
  await new Promise((resolve) => {
    server.listen(port, () => resolve());
  });
  return server;
}

if (require.main === module) {
  startServer(PORT).then((server) => {
    const address = server.address();
    console.log(`Sidhu Travels backend running on http://localhost:${address.port}`);
  });
}

module.exports = {
  startServer,
  createApp,
  handler,
  handleBooking,
  readBookings,
  saveBookings,
  parseJsonBody,
  sendJson
};
