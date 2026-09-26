const { sendJson } = require('../server.js');

module.exports = async function handler(req, res) {
  sendJson(res, 200, {
    status: 'ok',
    service: 'Sidhu Travels API',
    timestamp: new Date().toISOString()
  });
};
