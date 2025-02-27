import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 1. 사용자가 이벤트 참석 여부 등록 (POST /api/event-attendance)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { event_id, user_id, status } = req.body;

  if (!event_id || !user_id || !status) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO event_attendance (event_id, user_id, status) 
       VALUES ($1, $2, $3) RETURNING *`,
      [event_id, user_id, status]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 2. 특정 이벤트 참석자 조회 (GET /api/event-attendance/:eventId)
router.get('/:eventId', async (req: Request, res: Response): Promise<any> => {
  const eventId = req.params.eventId;

  try {
    const result = await pool.query(
      `SELECT event_attendance.*, users.name AS user_name 
       FROM event_attendance
       JOIN users ON event_attendance.user_id = users.id
       WHERE event_id = $1`,
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

// ✅ 3. 사용자가 참석한 이벤트 조회 (GET /api/event-attendance/user/:userId)
router.get(
  '/user/:userId',
  async (req: Request, res: Response): Promise<any> => {
    const userId = req.params.userId;

    try {
      const result = await pool.query(
        `SELECT event_attendance.*, events.title AS event_title, events.event_date 
       FROM event_attendance
       JOIN events ON event_attendance.event_id = events.id
       WHERE user_id = $1`,
        [userId]
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

// ✅ 4. 참석 상태 변경 (PUT /api/event-attendance/:id)
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const attendanceId = req.params.id;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Missing status field' });
  }

  try {
    const result = await pool.query(
      `UPDATE event_attendance SET status = $1 WHERE id = $2 RETURNING *`,
      [status, attendanceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 5. 참석 기록 삭제 (DELETE /api/event-attendance/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const attendanceId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM event_attendance WHERE id = $1 RETURNING *',
      [attendanceId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    return res.json({
      message: 'Attendance record deleted',
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
