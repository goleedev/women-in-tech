import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 메시지 보내기 (POST /api/messages)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { sender_id, receiver_id, content, session_id } = req.body;

  if (!sender_id || !receiver_id || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, content, session_id) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [sender_id, receiver_id, content, session_id || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 특정 대화 내역 조회 (GET /api/messages/:conversationId)
router.get(
  '/:conversationId',
  async (req: Request, res: Response): Promise<any> => {
    const conversationId = req.params.conversationId;

    try {
      const result = await pool.query(
        `SELECT * FROM messages 
       WHERE (sender_id = $1 OR receiver_id = $1) 
       ORDER BY sent_at ASC`,
        [conversationId]
      );

      return res.json(result.rows);
    } catch (error) {
      console.error('🔥 Database Error:', error);
      return res
        .status(500)
        .json({ error: 'Database error', details: (error as Error).message });
    }
  }
);

// ✅ 3. 모든 메시지 목록 조회 (GET /api/messages)
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await pool.query(
      `SELECT messages.*, 
              sender.name AS sender_name, receiver.name AS receiver_name 
       FROM messages
       JOIN users AS sender ON messages.sender_id = sender.id
       JOIN users AS receiver ON messages.receiver_id = receiver.id
       ORDER BY messages.sent_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 4. 메시지 읽음 처리 (PUT /api/messages/:id/read)
router.put('/:id/read', async (req: Request, res: Response): Promise<any> => {
  const messageId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE messages SET is_read = TRUE WHERE id = $1 RETURNING *`,
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
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
