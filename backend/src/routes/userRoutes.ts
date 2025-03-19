import express from 'express';
import {
  getUserProfile,
  updateUserProfile,
  updateUserTags,
} from '../controllers/userController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.get('/:id', getUserProfile);
router.put('/:id', protect, updateUserProfile);
router.put('/:id/tags', protect, updateUserTags);

export default router;
