import http from 'http';

import { setUpSocket } from './socket';
import app from './app';

// Set up PORT
const PORT = process.env.PORT || 5001;

// Set up Server
const server = http.createServer(app);

// Set up Socket Server
const io = setUpSocket(server);

// Set up Server Listener
server.listen(PORT, () => {
  console.log(`🦾 Server is running in ${process.env.NODE_ENV} on ${PORT}`);
});
