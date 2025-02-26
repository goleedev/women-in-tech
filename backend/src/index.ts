import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/users';
import sessionRoutes from './routes/sessions';
import messageRoutes from './routes/messages';
import reviewRoutes from './routes/reviews'; // ✅ 추가

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8008;

app.use(cors());
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes); // ✅ 리뷰 API 등록

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
