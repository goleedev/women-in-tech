import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 연결 요청 보내기 (POST /api/connections)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { sender_id, receiver_id } = req.body;

  if (!sender_id || !receiver_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (sender_id === receiver_id) {
    return res.status(400).json({ error: 'Cannot connect with yourself' });
  }

  try {
    // 이미 요청이 있는지 확인
    const existingRequest = await pool.query(
      `SELECT * FROM connections WHERE sender_id = $1 AND receiver_id = $2 AND status = 'pending'`,
      [sender_id, receiver_id]
    );

    if (existingRequest.rows.length > 0) {
      return res.status(409).json({ error: 'Connection request already sent' });
    }

    // 새로운 연결 요청 추가
    const result = await pool.query(
      `INSERT INTO connections (sender_id, receiver_id) VALUES ($1, $2) RETURNING *`,
      [sender_id, receiver_id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 사용자의 연결 요청 목록 조회 (GET /api/connections/:userId)
router.get('/:userId', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.userId;

  try {
    const result = await pool.query(
      `SELECT connections.*, sender.name AS sender_name, receiver.name AS receiver_name 
       FROM connections
       JOIN users AS sender ON connections.sender_id = sender.id
       JOIN users AS receiver ON connections.receiver_id = receiver.id
       WHERE receiver_id = $1 AND status = 'pending'
       ORDER BY created_at DESC`,
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

// ✅ 3. 연결 요청 수락 (PUT /api/connections/:id/accept)
router.put('/:id/accept', async (req: Request, res: Response): Promise<any> => {
  const connectionId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE connections SET status = 'accepted' WHERE id = $1 RETURNING *`,
      [connectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 4. 연결 요청 거절 (PUT /api/connections/:id/reject)
router.put('/:id/reject', async (req: Request, res: Response): Promise<any> => {
  const connectionId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE connections SET status = 'rejected' WHERE id = $1 RETURNING *`,
      [connectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 5. 연결 요청 취소 (DELETE /api/connections/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const connectionId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM connections WHERE id = $1 RETURNING *',
      [connectionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    return res.json({
      message: 'Connection request deleted',
      deletedRequest: result.rows[0],
    });
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

export default router;
