import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 멘티가 매칭 요청 보내기 (POST /api/matching)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const {
    mentee_id,
    preferred_tech_stack,
    preferred_experience,
    preferred_location,
  } = req.body;

  if (!mentee_id || !preferred_tech_stack || !preferred_experience) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO matching_requests (mentee_id, preferred_tech_stack, preferred_experience, preferred_location) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [
        mentee_id,
        preferred_tech_stack,
        preferred_experience,
        preferred_location,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 특정 멘티의 매칭 상태 조회 (GET /api/matching/:menteeId)
router.get('/:menteeId', async (req: Request, res: Response): Promise<any> => {
  const menteeId = req.params.menteeId;

  try {
    const result = await pool.query(
      `SELECT * FROM matching_requests WHERE mentee_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [menteeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No matching request found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 매칭 알고리즘 실행 (GET /api/matching/find)
router.get('/find', async (req: Request, res: Response): Promise<any> => {
  const { preferred_tech_stack, preferred_experience, preferred_location } =
    req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM users 
       WHERE job_title = 'mentor'
       AND tech_stack @> $1
       AND years_of_experience >= $2
       AND ($3 IS NULL OR country = $3) 
       ORDER BY years_of_experience DESC LIMIT 5`,
      [preferred_tech_stack, preferred_experience, preferred_location || null]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 4. 매칭 요청 수락 (PUT /api/matching/:id/accept)
router.put('/:id/accept', async (req: Request, res: Response): Promise<any> => {
  const matchingId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE matching_requests SET status = 'matched' WHERE id = $1 RETURNING *`,
      [matchingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matching request not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 5. 매칭 요청 거절 (PUT /api/matching/:id/reject)
router.put('/:id/reject', async (req: Request, res: Response): Promise<any> => {
  const matchingId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE matching_requests SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [matchingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matching request not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

export default router;
