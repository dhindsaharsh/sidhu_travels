const { handleBooking } = require('../server.js');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ success: false, message: 'Method not allowed.' }));
    return;
  }

  await handleBooking(req, res);
};
