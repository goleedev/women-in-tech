import express from 'express';

import {
  createEvent,
  getEventById,
  getEvents,
  updateEvent,
} from '../controllers/event/eventController';
import {
  getLikedEvents,
  likeEvent,
  unlikeEvent,
} from '../controllers/event/likeEventController';
import {
  attendEvent,
  cancelEventAttendance,
} from '../controllers/event/attendanceController';
import { protect } from '../middleware/auth';

// Set up the router
const router = express.Router();

// Public Access Routes
// Set up a route to get all events
router.get('/', getEvents);
// Set up a route to get liked events
router.get('/liked', protect, getLikedEvents);
// Set up a route to get event by id
router.get('/:id', getEventById);

// Protected Routes
// Set up a route to create an event
router.post('/', protect, createEvent);
// Set up a route to update an event
router.put('/:id', protect, updateEvent);
// Set up a route to attend an event
router.post('/:id/attend', protect, attendEvent);
// Set up a route to cancel event attendance
router.delete('/:id/attend', protect, cancelEventAttendance);
// Set up a route to like an event
router.post('/:id/like', protect, likeEvent);
// Set up a route to unlike an event
router.delete('/:id/like', protect, unlikeEvent);

export default router;
