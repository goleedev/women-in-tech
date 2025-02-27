import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 신고 등록 (POST /api/reports)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { reporter_id, reported_user_id, reason } = req.body;

  if (!reporter_id || !reported_user_id || !reason) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO reports (reporter_id, reported_user_id, reason) 
       VALUES ($1, $2, $3) RETURNING *`,
      [reporter_id, reported_user_id, reason]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 모든 신고 목록 조회 (GET /api/reports)
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await pool.query(
      `SELECT reports.*, reporter.name AS reporter_name, reported.name AS reported_name 
       FROM reports
       JOIN users AS reporter ON reports.reporter_id = reporter.id
       JOIN users AS reported ON reports.reported_user_id = reported.id
       ORDER BY created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 특정 사용자가 신고당한 내역 조회 (GET /api/reports/:userId)
router.get('/:userId', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM reports WHERE reported_user_id = $1 ORDER BY created_at DESC`,
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

// ✅ 4. 신고 검토 완료 (PUT /api/reports/:id/review)
router.put('/:id/review', async (req: Request, res: Response): Promise<any> => {
  const reportId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE reports SET status = 'reviewed' WHERE id = $1 RETURNING *`,
      [reportId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 5. 신고 해결 처리 (PUT /api/reports/:id/resolve)
router.put(
  '/:id/resolve',
  async (req: Request, res: Response): Promise<any> => {
    const reportId = req.params.id;

    try {
      const result = await pool.query(
        `UPDATE reports SET status = 'resolved' WHERE id = $1 RETURNING *`,
        [reportId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Report not found' });
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

export default router;
