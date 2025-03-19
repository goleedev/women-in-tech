import express, { Request, Response, Router } from 'express';
import pool from '../config/db';
import { mentorMatchingService } from '../services/matchingService';

const router: Router = express.Router();

// ✅ 1. 멘티가 매칭 요청 보내기 (POST /api/matching)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const { mentee_id, mentor_id } = req.body;

  if (!mentee_id || !mentor_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 매칭 요청 생성
    const result = await pool.query(
      "INSERT INTO matching_requests (mentee_id, mentor_id, status) VALUES ($1, $2, 'pending') RETURNING *",
      [mentee_id, mentor_id]
    );

    // 멘토 역할 자동 업데이트
    await pool.query(
      "UPDATE users SET job_title = 'Mentor' WHERE id = $1 AND job_title IS NULL",
      [mentor_id]
    );

    // WebSocket 알림 전송
    // @ts-ignore: 타입 선언에 없는 프로퍼티 접근
    if (req.io) {
      // 멘티 정보 조회
      const menteeResult = await pool.query(
        "SELECT name FROM users WHERE id = $1",
        [mentee_id]
      );
      
      // 알림 내용 생성
      const notificationMessage = `${menteeResult.rows[0]?.name || 'A user'} has requested to connect as a mentee`;
      
      // 알림 DB에 저장
      await pool.query(
        "INSERT INTO notifications (user_id, type, message) VALUES ($1, $2, $3)",
        [mentor_id, 'mentor_request', notificationMessage]
      );
      
      // 실시간 알림 전송
      // @ts-ignore: 타입 선언에 없는 메서드 호출
      req.sendNotification(req.io, mentor_id, {
        type: 'mentor_request',
        message: notificationMessage,
        data: {
          requestId: result.rows[0].id,
          menteeId: mentee_id
        }
      });
    }

    return res.status(201).json({ message: 'Mentorship request sent', request: result.rows[0] });
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
      `SELECT mr.*, 
              u.name as mentor_name, 
              u.job_title as mentor_job_title,
              u.tech_stack as mentor_tech_stack,
              u.country as mentor_country
       FROM matching_requests mr
       JOIN users u ON mr.mentor_id = u.id
       WHERE mr.mentee_id = $1 
       ORDER BY mr.created_at DESC`,
      [menteeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No matching request found' });
    }

    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 3. 향상된 멘토 매칭 알고리즘 (GET /api/matching/find/:menteeId)
router.get('/find/:menteeId', async (req: Request, res: Response): Promise<any> => {
  const menteeId = parseInt(req.params.menteeId);
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

  try {
    // 향상된 매칭 알고리즘 적용
    const matchedMentors = await mentorMatchingService.findMentorForMentee(ment