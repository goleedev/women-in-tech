import express, { Application, Request, Response, NextFunction } from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';

// Routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import eventRoutes from './routes/event';
import mentorshipRoutes from './routes/mentorship';
import chatRoutes from './routes/chat';
import notificationRoutes from './routes/notification';
import tagRoutes from './routes/tag';

// Set up the env variables
config();

// Set up the express app
const app: Application = express();

// Set up CORS
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://women-in-tech-seven.vercel.app/',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // enable set cookie
  })
);

// Set up the express app to parse data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Set up the default route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: '🏃🏻 API is running' });
});

// Set up more routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/mentorship', mentorshipRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/tags', tagRoutes);

// Set up 404
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: '🙅🏻 Not found' });
});

// Set up global errors
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || '⚠️ Something went wrong',
  });
});

export default app;
