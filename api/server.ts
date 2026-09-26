import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { createApp } = require('./server.js');

const port = Number(process.env.PORT) || 3000;

const server = createApp();

server.listen(port, () => {
  console.log(`Sidhu Travels server running on port ${port}`);
});