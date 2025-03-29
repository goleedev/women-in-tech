import express from 'express';

import { getUsers } from '../controllers/mentorship/mentorshipController';
import {
  connectRequest,
  getConnectionRequests,
  getMyConnections,
  updateConnectionStatus,
} from '../controllers/mentorship/connectionController';
import { getRecommendedMentors } from '../controllers/mentorship/recommendationController';
import { protect } from '../middleware/auth';

// Set up the router
const router = express.Router();

// Mentorship
// Set up a route to get all users
router.get('/users', getUsers);
// Set up a route to connect with a user
router.post('/connect', protect, connectRequest);
// Set up a route to update connection status
router.put('/connect/:id', protect, updateConnectionStatus);
// Set up a route to get connection requests
router.get('/connect/requests', protect, getConnectionRequests);
// Set up a route to get my connections
router.get('/connect', protect, getMyConnections);
// Set up a route to get recommended mentors
router.get('/recommended', protect, getRecommendedMentors);

export default router;
