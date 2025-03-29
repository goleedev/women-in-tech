import express from 'express';

import {
  getUserProfile,
  updateUserProfile,
  updateUserTags,
} from '../controllers/user/userController';
import { protect } from '../middleware/auth';

// Set up the router
const router = express.Router();

// User Profile
// Set up a route to get user profile
router.get('/:id', getUserProfile);
// Set up a route to update user profile
router.put('/:id', protect, updateUserProfile);
// Set up a route to update user tags
router.put('/:id/tags', protect, updateUserTags);

export default router;
