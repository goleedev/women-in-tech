import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import connectionRoutes from './routes/connections';
import eventAttendanceRoutes from './routes/event-attendance';
import eventRoutes from './routes/events';
import favoritesRoutes from './routes/favorites';
import matchingRoutes from './routes/matching';
import messageRoutes from './routes/messages';
import notificationsRoutes from './routes/notifications'; // ✅ 추가
import postEventChatRoutes from './routes/post-event-chat';
import reportRoutes from './routes/reports';
import reviewRoutes from './routes/reviews';
import sessionRoutes from './routes/sessions';
import userRoutes from './routes/users';
import verificationRoutes from './routes/verification';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;

app.use(cors());
// app.use(
//   cors({
//     origin: ['http://localhost:3000', 'https://myapp.com'], // 허용할 프론트엔드 도메인
//     credentials: true,
//   })
// );
app.use(express.json());

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
app.use('/api/notifications', notificationsRoutes); // ✅ 알림 API 등록

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
