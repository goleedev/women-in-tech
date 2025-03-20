import express from 'express';
import { getAllTags } from '../controllers/tagController';

const router = express.Router();

// 전체 태그 목록 조회
router.get('/', getAllTags);

export default router;
