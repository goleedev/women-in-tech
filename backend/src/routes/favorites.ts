import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 즐겨찾기 추가 (POST /api/favorites)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { user_id, target_id, target_type } = req.body;

  if (!user_id || !target_id || !target_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['mentor', 'event'].includes(target_type)) {
    return res.status(400).json({ error: 'Invalid target type' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO favorites (user_id, target_id, target_type) 
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, target_id, target_type]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 사용자의 즐겨찾기 목록 조회 (GET /api/favorites/:userId)
router.get('/:userId', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM favorites WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 즐겨찾기 삭제 (DELETE /api/favorites/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const favoriteId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM favorites WHERE id = $1 RETURNING *`,
      [favoriteId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    return res.json({
      message: 'Favorite deleted',
      deletedRecord: result.rows[0],
    });
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

export default router;
