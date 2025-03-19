import express from 'express';
import { register, login, getMe, logout } from '../controllers/authController';
import { protect } from '../middleware/auth';
import { registerValidation, loginValidation } from '../middleware/validation';

const router = express.Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

export default router;
