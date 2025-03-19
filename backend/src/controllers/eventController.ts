import { Request, RequestHandler, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

// Request 타입 확장
interface AuthRequest extends Request {
  user?: any;
}

// 이벤트 목록 조회
export const getEvents = async (req: Request, res: Response) => {
  try {
    const { location, date, topic, search, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let queryParams: any[] = [];
    let queryConditions: string[] = [];
    let queryIndex = 1;

    // 조건 추가
    if (location) {
      queryConditions.push(`location ILIKE $${queryIndex}`);
      queryParams.push(`%${location}%`);
      queryIndex++;
    }

    if (date) {
      queryConditions.push(`DATE(date) = $${queryIndex}`);
      queryParams.push(date);
      queryIndex++;
    }

    if (topic) {
      queryConditions.push(`topic ILIKE $${queryIndex}`);
      queryParams.push(`%${topic}%`);
      queryIndex++;
    }

    if (search) {
      queryConditions.push(
        `(title ILIKE $${queryIndex} OR description ILIKE $${queryIndex})`
      );
      queryParams.push(`%${search}%`);
      queryIndex++;
    }

    const whereClause =
      queryConditions.length > 0
        ? `WHERE ${queryConditions.join(' AND ')}`
        : '';

    // 이벤트 수 조회
    const countQuery = `
      SELECT COUNT(*) FROM events
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // 이벤트 목록 조회
    queryParams.push(Number(limit));
    queryParams.push(offset);

    const eventsQuery = `
      SELECT e.id, e.title, e.description, e.date, e.end_date, e.location, e.topic,
             e.max_attendees, e.image_url, e.is_online, e.online_link, e.status,
             u.id as organizer_id, u.name as organizer_name,
             (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as current_attendees
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ${whereClause}
      ORDER BY e.date ASC
      LIMIT $${queryIndex} OFFSET $${queryIndex + 1}
    `;

    const eventsResult = await pool.query(eventsQuery, queryParams);

    // 인증된 사용자인 경우 좋아요 상태 추가
    const authHeader = req.headers.authorization;
    let userId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        );
        userId = decoded.id;
      } catch (error) {
        // 토큰 검증 실패, 무시하고 진행
      }
    }

    let events = eventsResult.rows;

    if (userId) {
      // 이벤트 태그 및 좋아요 정보 추가
      for (let i = 0; i < events.length; i++) {
        // 태그 정보 조회
        const tagsResult = await pool.query(
          `SELECT t.name
           FROM tags t
           JOIN event_tags et ON t.id = et.tag_id
           WHERE et.event_id = $1`,
          [events[i].id]
        );

        events[i].tags = tagsResult.rows.map((tag) => tag.name);

        // 좋아요 정보 조회
        const likeResult = await pool.query(
          `SELECT id FROM event_likes
           WHERE event_id = $1 AND user_id = $2`,
          [events[i].id, userId]
        );

        events[i].is_liked = likeResult.rows.length > 0;
      }
    } else {
      // 비인증 사용자는 태그만 추가
      for (let i = 0; i < events.length; i++) {
        const tagsResult = await pool.query(
          `SELECT t.name
           FROM tags t
           JOIN event_tags et ON t.id = et.tag_id
           WHERE et.event_id = $1`,
          [events[i].id]
        );

        events[i].tags = tagsResult.rows.map((tag) => tag.name);
        events[i].is_liked = false;
      }
    }

    // 응답 형식화
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      end_date: event.end_date,
      location: event.location,
      topic: event.topic,
      organizer: {
        id: event.organizer_id,
        name: event.organizer_name,
      },
      max_attendees: event.max_attendees,
      current_attendees: event.current_attendees,
      image_url: event.image_url,
      is_online: event.is_online,
      online_link: event.online_link,
      status: event.status,
      is_liked: event.is_liked,
      tags: event.tags,
    }));

    res.status(200).json({
      events: formattedEvents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('이벤트 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 목록 조회 중 오류가 발생했습니다',
    });
  }
};

// 이벤트 생성
export const createEvent = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();

  try {
    const {
      title,
      description,
      date,
      end_date,
      location,
      topic,
      max_attendees,
      is_online,
      online_link,
      tags,
    } = req.body;

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 이벤트 생성
    const eventResult = await client.query(
      `INSERT INTO events
       (title, description, date, end_date, location, topic, organizer_id, max_attendees, is_online, online_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, date`,
      [
        title,
        description,
        date,
        end_date,
        location,
        topic,
        req.user.id,
        max_attendees,
        is_online,
        online_link,
      ]
    );

    const eventId = eventResult.rows[0].id;

    // 태그 처리
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // 태그가 존재하는지 확인
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1',
          [tagName]
        );

        let tagId;

        // 태그가 존재하지 않으면 생성
        if (tagResult.rows.length === 0) {
          const newTagResult = await client.query(
            'INSERT INTO tags (name, category) VALUES ($1, $2) RETURNING id',
            [tagName, 'topic'] // 기본 카테고리 설정
          );
          tagId = newTagResult.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        // 이벤트-태그 연결
        await client.query(
          'INSERT INTO event_tags (event_id, tag_id) VALUES ($1, $2)',
          [eventId, tagId]
        );
      }
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: '이벤트가 생성되었습니다',
      event: eventResult.rows[0],
    });
  } catch (error) {
    // 트랜잭션 롤백
    await client.query('ROLLBACK');

    console.error('이벤트 생성 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 생성 중 오류가 발생했습니다',
    });
  } finally {
    client.release();
  }
};

export const updateEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const eventId = req.params.id;

    // 이벤트 존재 여부 확인
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [
      eventId,
    ]);

    if (eventResult.rows.length === 0) {
      res
        .status(404)
        .json({ success: false, message: '이벤트를 찾을 수 없습니다' });
      return;
    }

    // 본인 이벤트 또는 관리자만 수정 가능
    if (
      eventResult.rows[0].organizer_id !== req.user?.id &&
      req.user?.role !== 'admin'
    ) {
      res
        .status(403)
        .json({ success: false, message: '이벤트를 수정할 권한이 없습니다' });
      return;
    }

    const {
      title,
      description,
      date,
      end_date,
      location,
      topic,
      max_attendees,
    } = req.body;

    await pool.query(
      `UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description),
       date = COALESCE($3, date), end_date = COALESCE($4, end_date), location = COALESCE($5, location),
       topic = COALESCE($6, topic), max_attendees = COALESCE($7, max_attendees)
       WHERE id = $8`,
      [
        title,
        description,
        date,
        end_date,
        location,
        topic,
        max_attendees,
        eventId,
      ]
    );

    res
      .status(200)
      .json({ success: true, message: '이벤트가 업데이트되었습니다' });
  } catch (error) {
    console.error('이벤트 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 업데이트 중 오류가 발생했습니다',
    });
  }
};

// 이벤트 참가 신청
export const attendEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다' });
      return;
    }

    // 참가 신청 로직
    await pool.query(
      'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2)',
      [eventId, userId]
    );

    res
      .status(200)
      .json({ success: true, message: '이벤트 참가 신청이 완료되었습니다' });
  } catch (error) {
    console.error('이벤트 참가 신청 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 참가 신청 중 오류가 발생했습니다',
    });
  }
};

// 이벤트 참가 취소
export const cancelEventAttendance: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다' });
      return;
    }

    await pool.query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    res
      .status(200)
      .json({ success: true, message: '이벤트 참가가 취소되었습니다' });
  } catch (error) {
    console.error('이벤트 참가 취소 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 참가 취소 중 오류가 발생했습니다',
    });
  }
};

// 이벤트 좋아요
export const likeEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다' });
      return;
    }

    await pool.query(
      'INSERT INTO event_likes (event_id, user_id) VALUES ($1, $2)',
      [eventId, userId]
    );

    res.status(200).json({ success: true, message: '이벤트를 좋아요했습니다' });
  } catch (error) {
    console.error('이벤트 좋아요 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 좋아요 중 오류가 발생했습니다',
    });
  }
};

// 이벤트 좋아요 취소
export const unlikeEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const eventId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: '인증이 필요합니다' });
      return;
    }

    await pool.query(
      'DELETE FROM event_likes WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    res
      .status(200)
      .json({ success: true, message: '이벤트 좋아요를 취소했습니다' });
  } catch (error) {
    console.error('이벤트 좋아요 취소 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 좋아요 취소 중 오류가 발생했습니다',
    });
  }
};

export const getEventById: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const eventId = req.params.id;

    // 이벤트 기본 정보 조회
    const eventResult = await pool.query(
      `SELECT e.id, e.title, e.description, e.date, e.end_date, e.location, e.topic,
              e.max_attendees, e.image_url, e.is_online, e.online_link, e.status,
              u.id as organizer_id, u.name as organizer_name, u.email as organizer_email
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '이벤트를 찾을 수 없습니다',
      });
      return;
    }

    const event = eventResult.rows[0];

    // 참가자 수 조회
    const attendeesCountResult = await pool.query(
      `SELECT COUNT(*) FROM event_attendees WHERE event_id = $1`,
      [eventId]
    );

    event.current_attendees = parseInt(attendeesCountResult.rows[0].count);

    // 태그 조회
    const tagsResult = await pool.query(
      `SELECT t.name
       FROM tags t
       JOIN event_tags et ON t.id = et.tag_id
       WHERE et.event_id = $1`,
      [eventId]
    );

    event.tags = tagsResult.rows.map((tag) => tag.name);

    // 참가자 목록 조회
    const attendeesResult = await pool.query(
      `SELECT u.id, u.name
       FROM users u
       JOIN event_attendees ea ON u.id = ea.user_id
       WHERE ea.event_id = $1`,
      [eventId]
    );

    event.attendees = attendeesResult.rows;

    // 응답
    res.status(200).json(event);
  } catch (error) {
    console.error('이벤트 상세 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '이벤트 상세 정보 조회 중 오류가 발생했습니다',
    });
  }
};

export const getLikedEvents: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // 좋아요한 이벤트 수 조회
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM event_likes WHERE user_id = $1',
      [userId]
    );

    const total = parseInt(countResult.rows[0].count);

    // 좋아요한 이벤트 목록 조회
    const likedEventsResult = await pool.query(
      `SELECT e.id, e.title, e.description, e.date, e.location, e.topic,
              u.id as organizer_id, u.name as organizer_name,
              e.image_url, e.status
       FROM events e
       JOIN event_likes el ON e.id = el.event_id
       JOIN users u ON e.organizer_id = u.id
       WHERE el.user_id = $1
       ORDER BY el.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const events = likedEventsResult.rows.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      location: event.location,
      topic: event.topic,
      organizer: {
        id: event.organizer_id,
        name: event.organizer_name,
      },
      image_url: event.image_url,
      status: event.status,
    }));

    res.status(200).json({
      events,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('좋아요한 이벤트 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '좋아요한 이벤트 목록 조회 중 오류가 발생했습니다',
    });
  }
};
