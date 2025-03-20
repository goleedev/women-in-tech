import http from 'http';
import app from './app';
import { setupSocketServer } from './socket';

const PORT = process.env.PORT || 5001;

const server = http.createServer(app);

// WebSocket 서버 설정
const io = setupSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
