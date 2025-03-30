import express from 'express';

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notification/notificationController';
import { protect } from '../middleware/auth';

// Set up the router
const router = express.Router();

// Use the protect middleware to protect all routes
router.use(protect);

// Notifications
// Set up a route to get all notifications
router.get('/', getNotifications);
// Set up a route to mark a notification as read
router.put('/:id/read', markNotificationAsRead);
// Set up a route to mark all notifications as read
router.put('/read-all', markAllNotificationsAsRead);

export default router;
