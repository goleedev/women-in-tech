import express from 'express';
import {
  getChatRooms,
  joinChatRoom,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
} from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = express.Router();

// 모든 채팅 라우트는 인증 필요
router.use(protect);

// 채팅방 목록 조회
router.get('/rooms', getChatRooms);

// 채팅방 참가
router.post('/rooms/:id/join', joinChatRoom);

// 채팅방 메시지 목록 조회
router.get('/rooms/:id/messages', getChatMessages);

// 메시지 전송
router.post('/rooms/:id/messages', sendMessage);

// 채팅방 메시지 읽음 처리
router.put('/rooms/:id/read', markMessagesAsRead);

export default router;
