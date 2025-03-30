import express from 'express';

import { registerValidation, loginValidation } from '../middleware/validation';
import { protect } from '../middleware/auth';
import { register } from '../controllers/auth/registerController';
import { login, logout } from '../controllers/auth/loginController';
import { getMyProfile } from '../controllers/auth/profileController';

// Set up the router
const router = express.Router();

// Set up the routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMyProfile);

export default router;
