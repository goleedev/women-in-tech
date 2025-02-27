import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 새로운 이벤트 등록 (POST /api/events)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { title, description, organizer_id, location, event_date, event_type } =
    req.body;

  if (!title || !event_date || !event_type) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO events (title, description, organizer_id, location, event_date, event_type) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, description, organizer_id, location, event_date, event_type]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 이벤트 목록 검색 및 필터링 (GET /api/events)
router.get('/', async (req: Request, res: Response): Promise<any> => {
  const { search, event_type } = req.query; // 검색어 및 필터

  try {
    let query = 'SELECT * FROM events WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ` AND (title ILIKE $${params.length + 1} OR description ILIKE $${
        params.length + 1
      })`;
      params.push(`%${search}%`);
    }

    if (event_type) {
      query += ` AND event_type = $${params.length + 1}`;
      params.push(event_type);
    }

    query += ' ORDER BY event_date ASC';

    const result = await pool.query(query, params);
    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 특정 이벤트 상세 조회 (GET /api/events/:id)
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const eventId = req.params.id;

  try {
    const result = await pool.query('SELECT * FROM events WHERE id = $1', [
      eventId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 4. 이벤트 삭제 (DELETE /api/events/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const eventId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM events WHERE id = $1 RETURNING *',
      [eventId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({
      message: 'Event deleted',
      deletedEvent: result.rows[0],
    });
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

export default router;
