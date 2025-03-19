// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from 'dotenv';
import authRoutes from './routes/authRoutes';
import eventRoutes from './routes/eventRoutes'; // Add this line
import userRoutes from './routes/userRoutes'; // Add this line if needed

// 환경 변수 로드
config();

const app: Application = express();

// CORS 설정을 더 구체적으로 업데이트합니다
app.use(
  cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Frontend URLs
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // If you're using cookies or auth
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Women in Tech Networking Platform API' });
});

// API 라우트 설정
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes); // Add this line
app.use('/api/v1/users', userRoutes); // Add this line if needed

// 404 에러 처리
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: '요청한 리소스를 찾을 수 없습니다' });
});

// 글로벌 에러 핸들러
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '서버 에러가 발생했습니다',
  });
});

export default app;
