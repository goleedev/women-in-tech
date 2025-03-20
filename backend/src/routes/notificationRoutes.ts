import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController';
import { protect } from '../middleware/auth';

const router = express.Router();

// 모든 알림 라우트는 인증 필요
router.use(protect);

// 알림 목록 조회
router.get('/', getNotifications);

// 특정 알림 읽음 처리
router.put('/:id/read', markNotificationAsRead);

// 모든 알림 읽음 처리
router.put('/read-all', markAllNotificationsAsRead);

export default router;
