import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from 'dotenv';
import authRoutes from './routes/authRoutes';

// 라우터 import (나중에 추가)
// import authRoutes from './routes/authRoutes';

// 환경 변수 로드
config();

const app: Application = express();

// 미들웨어 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API 라우트 설정 (나중에 추가)
// app.use('/api/v1/auth', authRoutes);

// 기본 라우트
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Women in Tech Networking Platform API' });
});

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

// API 라우트 설정
app.use('/api/v1/auth', authRoutes);

export default app;
