import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 새 알림 생성 (POST /api/notifications)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { user_id, type, message } = req.body;

  if (!user_id || !type || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!['mentor_request', 'event_update', 'message', 'system'].includes(type)) {
    return res.status(400).json({ error: 'Invalid notification type' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, message) 
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, type, message]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 사용자의 알림 목록 조회 (GET /api/notifications/:userId)
router.get('/:userId', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
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

// ✅ 3. 특정 알림 읽음 처리 (PUT /api/notifications/:id/read)
router.put('/:id/read', async (req: Request, res: Response): Promise<any> => {
  const notificationId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 4. 특정 알림 삭제 (DELETE /api/notifications/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const notificationId = req.params.id;

  try {
    const result = await pool.query(
      `DELETE FROM notifications WHERE id = $1 RETURNING *`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.json({
      message: 'Notification deleted',
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
