import express from 'express';

import {
  getChatRooms,
  joinChatRoom,
} from '../controllers/chat/chatRoomController';
import {
  getChatMessages,
  markMessagesAsRead,
  sendMessage,
} from '../controllers/chat/messagesController';
import { protect } from '../middleware/auth';

// Set up the router
const router = express.Router();

// Use the protect middleware to protect all routes
router.use(protect);

// Chat Rooms
// Set up a route to get all chat rooms
router.get('/rooms', getChatRooms);
// Set up a route to join a chat room
router.post('/rooms/:id/join', joinChatRoom);

// Messages
// Set up a route to get chat messages
router.get('/rooms/:id/messages', getChatMessages);
// Set up a route to send a message
router.post('/rooms/:id/messages', sendMessage);
// Set up a route to mark messages as read
router.put('/rooms/:id/read', markMessagesAsRead);

export default router;
