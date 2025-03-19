import express from 'express';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  attendEvent,
  cancelEventAttendance,
  likeEvent,
  unlikeEvent,
  getLikedEvents,
} from '../controllers/eventController';
import { protect } from '../middleware/auth';

const router = express.Router();

// 공개 접근 가능 라우트
router.get('/', getEvents);
router.get('/:id', getEventById);

// 인증 필요 라우트
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.post('/:id/attend', protect, attendEvent);
router.delete('/:id/attend', protect, cancelEventAttendance);
router.post('/:id/like', protect, likeEvent);
router.delete('/:id/like', protect, unlikeEvent);
router.get('/liked', protect, getLikedEvents);

export default router;
