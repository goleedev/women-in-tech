import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 메시지 보내기 (POST /api/post-event-chat)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { event_id, user_id, content } = req.body;

  if (!event_id || !user_id || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 이벤트 참가자인지 확인
    const checkParticipant = await pool.query(
      `SELECT * FROM event_attendance WHERE event_id = $1 AND user_id = $2`,
      [event_id, user_id]
    );

    if (checkParticipant.rows.length === 0) {
      return res
        .status(403)
        .json({ error: 'User is not an event participant' });
    }

    // 메시지 저장
    const result = await pool.query(
      `INSERT INTO post_event_chat (event_id, user_id, content) 
       VALUES ($1, $2, $3) RETURNING *`,
      [event_id, user_id, content]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 특정 이벤트의 채팅 내역 조회 (GET /api/post-event-chat/:eventId)
router.get('/:eventId', async (req: Request, res: Response): Promise<any> => {
  const eventId = req.params.eventId;

  try {
    const result = await pool.query(
      `SELECT post_event_chat.*, users.name AS sender_name 
       FROM post_event_chat
       JOIN users ON post_event_chat.user_id = users.id
       WHERE event_id = $1
       ORDER BY sent_at ASC`,
      [eventId]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 메시지 읽음 처리 (PUT /api/post-event-chat/:id/read)
router.put('/:id/read', async (req: Request, res: Response): Promise<any> => {
  const messageId = req.params.id;

  try {
    const result = await pool.query(
      `UPDATE post_event_chat SET is_read = TRUE WHERE id = $1 RETURNING *`,
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
