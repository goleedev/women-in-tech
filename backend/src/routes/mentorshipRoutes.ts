import express from 'express';
import {
  getUsers,
  connectRequest,
  updateConnectionStatus,
  getConnectionRequests,
  getMyConnections,
  getRecommendedMentors,
} from '../controllers/mentorshipController';
import { protect } from '../middleware/auth';

const router = express.Router();

// 멘토/멘티 검색
router.get('/users', getUsers);

// 멘토십 연결 요청
router.post('/connect', protect, connectRequest);

// 멘토십 연결 요청 수락/거절
router.put('/connect/:id', protect, updateConnectionStatus);

// 멘토십 연결 요청 목록
router.get('/connect/requests', protect, getConnectionRequests);

// 내 멘토십 연결 목록
router.get('/connect', protect, getMyConnections);

// 추천 멘토 조회
router.get('/recommended', protect, getRecommendedMentors);

export default router;
