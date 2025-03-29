import express from 'express';

import { getAllTags } from '../controllers/tag/tagController';

// Set up the router
const router = express.Router();

// Set up a route to get all tags
router.get('/', getAllTags);

export default router;
