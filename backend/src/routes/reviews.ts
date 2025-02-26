import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 멘토 리뷰 남기기 (POST /api/reviews)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { session_id, mentor_id, mentee_id, rating, comment } = req.body;

  if (!session_id || !mentor_id || !mentee_id || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reviews (session_id, mentor_id, mentee_id, rating, comment) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [session_id, mentor_id, mentee_id, rating, comment || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 특정 멘토의 리뷰 조회 (GET /api/reviews/:mentorId)
router.get('/:mentorId', async (req: Request, res: Response): Promise<any> => {
  const mentorId = req.params.mentorId;

  try {
    const result = await pool.query(
      `SELECT reviews.*, mentee.name AS mentee_name 
       FROM reviews
       JOIN users AS mentee ON reviews.mentee_id = mentee.id
       WHERE mentor_id = $1
       ORDER BY created_at DESC`,
      [mentorId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 리뷰 삭제 (DELETE /api/reviews/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const reviewId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM reviews WHERE id = $1 RETURNING *',
      [reviewId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    return res.json({
      message: 'Review deleted',
      deletedReview: result.rows[0],
    });
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

export default router;
