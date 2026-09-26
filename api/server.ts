import { startServer } from './server.js';

const port = Number(process.env.PORT) || 3000;

startServer(port).catch((error) => {
  console.error('Failed to start Sidhu Travels server:', error);
  process.exit(1);
});