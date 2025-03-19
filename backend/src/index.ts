import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import {
  initializeSocketServer,
  sendNotificationToUser,
} from './routes/socket';
import connectionRoutes from './routes/connections';
import eventAttendanceRoutes from './routes/event-attendance';
import eventRoutes from './routes/events';
import favoritesRoutes from './routes/favorites';
import matchingRoutes from './routes/matching';
import messageRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications';
import postEventChatRoutes from './routes/post-event-chat';
import reportRoutes from './routes/reports';
import reviewRoutes from './routes/reviews';
import sessionRoutes from './routes/sessions';
import userRoutes from './routes/users';
import verificationRoutes from './routes/verification';
import searchRoutes from './routes/search'; // 새로 추가된 검색 라우트

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8008;

// Socket.io 초기화
const io = initializeSocketServer(server);

// 전역 소켓 인스턴스를 요청 객체에 추가하는 미들웨어
app.use((req, res, next) => {
  // @ts-ignore: 타입 선언에 없는 프로퍼티 추가
  req.io = io;
  // @ts-ignore: 타입 선언에 없는 프로퍼티 추가
  req.sendNotification = sendNotificationToUser;
  next();
});

const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:3000'];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type,Authorization',
  })
);

app.use(express.json());

// 라우트 등록
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/event-attendance', eventAttendanceRoutes);
app.use('/api/post-event-chat', postEventChatRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search', searchRoutes); // 새로 추가된 검색 라우트

// 서버 시작
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server initialized`);
});
