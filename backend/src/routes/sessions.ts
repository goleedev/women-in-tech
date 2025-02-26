import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 멘티가 멘토에게 세션 요청 (POST /api/sessions)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { mentor_id, mentee_id, scheduled_time, duration } = req.body;

  if (!mentor_id || !mentee_id || !scheduled_time || !duration) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO sessions (mentor_id, mentee_id, scheduled_time, duration) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [mentor_id, mentee_id, scheduled_time, duration]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 멘토가 세션 요청 승인 (PUT /api/sessions/:id/approve)
router.put(
  '/:id/approve',
  async (req: Request, res: Response): Promise<any> => {
    const sessionId = req.params.id;

    try {
      const result = await pool.query(
        `UPDATE sessions SET status = 'approved' WHERE id = $1 RETURNING *`,
        [sessionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Session not found' });
      }

      return res.json(result.rows[0]);
    } catch (error) {
      console.error('🔥 Database Error:', error);
      return res
        .status(500)
        .json({ error: 'Database error', details: (error as Error).message });
    }
  }
);

// ✅ 3. 모든 세션 목록 조회 (GET /api/sessions)
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await pool.query(
      `SELECT sessions.*, 
              mentor.name AS mentor_name, mentee.name AS mentee_name 
       FROM sessions
       JOIN users AS mentor ON sessions.mentor_id = mentor.id
       JOIN users AS mentee ON sessions.mentee_id = mentee.id`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 4. 세션 취소 (DELETE /api/sessions/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const sessionId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM sessions WHERE id = $1 RETURNING *',
      [sessionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    return res.json({
      message: 'Session canceled',
      deletedSession: result.rows[0],
    });
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

export default router;
