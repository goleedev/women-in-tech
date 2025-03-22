// backend/src/controllers/mentorshipController.ts
import { Request, Response } from 'express';
import pool from '../config/database';
import { findMentorForMentee } from '../services/mentorshipService';

// Request 타입 확장
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// 멘토/멘티 검색
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      role,
      mode, // 활동 모드 파라미터 추가
      expertise,
      seniority_level,
      country,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const currentUserId = req.user?.id;

    let queryParams: any[] = [];
    let queryConditions: string[] = [];
    let queryIndex = 1;

    // 역할 필터
    if (role) {
      // 역할 필터를 개선: 주 역할 또는 보조 역할 포함
      queryConditions.push(
        `(role = $${queryIndex} OR secondary_role = $${queryIndex})`
      );
      queryParams.push(role);
      queryIndex++;
    }

    // 활성 역할 모드 고려 (선택 사항)
    if (mode) {
      // 사용자의 현재 활성 역할을 기준으로 필터링
      if (mode === 'mentor') {
        // 멘토는 멘티를 찾음
        queryConditions.push(`(role = 'mentee' OR secondary_role = 'mentee')`);
      } else if (mode === 'mentee') {
        // 멘티는 멘토를 찾음
        queryConditions.push(`(role = 'mentor' OR secondary_role = 'mentor')`);
      }
    }

    // 전문 분야 필터
    if (expertise) {
      queryConditions.push(`expertise ILIKE $${queryIndex}`);
      queryParams.push(`%${expertise}%`);
      queryIndex++;
    }

    // 경력 수준 필터
    if (seniority_level) {
      queryConditions.push(`seniority_level = $${queryIndex}`);
      queryParams.push(seniority_level);
      queryIndex++;
    }

    // 국가 필터
    if (country) {
      queryConditions.push(`country ILIKE $${queryIndex}`);
      queryParams.push(`%${country}%`);
      queryIndex++;
    }

    // 검색어 필터
    if (search) {
      queryConditions.push(
        `(name ILIKE $${queryIndex} OR expertise ILIKE $${queryIndex} OR profession ILIKE $${queryIndex})`
      );
      queryParams.push(`%${search}%`);
      queryIndex++;
    }

    // 본인은 제외 (중요)
    if (currentUserId) {
      queryConditions.push(`id != $${queryIndex}`);
      queryParams.push(currentUserId);
      queryIndex++;
    }

    const whereClause =
      queryConditions.length > 0
        ? `WHERE ${queryConditions.join(' AND ')}`
        : '';

    // 전체 사용자 수 조회
    const countQuery = `
      SELECT COUNT(*) FROM users
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // 사용자 목록 조회
    const usersQuery = `
      SELECT id, name, expertise, profession, seniority_level, country, role, secondary_role, bio, profile_image_url
      FROM users
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${queryIndex} OFFSET $${queryIndex + 1}
    `;

    queryParams.push(Number(limit));
    queryParams.push(offset);

    const usersResult = await pool.query(usersQuery, queryParams);

    let users = usersResult.rows;

    // 현재 사용자에 대한 추가 정보: 태그, 유사도, 연결 상태
    if (currentUserId) {
      // 현재 사용자 정보 조회 (유사도 계산용)
      const currentUserResult = await pool.query(
        `SELECT expertise, profession, seniority_level, country FROM users WHERE id = $1`,
        [currentUserId]
      );

      if (currentUserResult.rows.length > 0) {
        const currentUser = currentUserResult.rows[0];

        // 각 사용자에 대해 태그, 유사도, 연결 상태 추가
        for (let i = 0; i < users.length; i++) {
          // 태그 조회
          const tagsResult = await pool.query(
            `SELECT t.name
             FROM tags t
             JOIN user_tags ut ON t.id = ut.tag_id
             WHERE ut.user_id = $1`,
            [users[i].id]
          );

          users[i].tags = tagsResult.rows.map((tag) => tag.name);

          // 유사도 계산 (간단한 구현)
          let similarityScore = 0;

          if (users[i].expertise === currentUser.expertise)
            similarityScore += 3;
          if (users[i].profession === currentUser.profession)
            similarityScore += 2;
          if (users[i].country === currentUser.country) similarityScore += 2;

          // 경력 수준에 따른 가중치 (멘토-멘티 관계에 적합하도록)
          if (req.user?.role === 'mentee' && users[i].role === 'mentor') {
            if (users[i].seniority_level === 'Senior') similarityScore += 2;
            else if (users[i].seniority_level === 'Mid-level')
              similarityScore += 1.5;
          }

          users[i].similarity_score = similarityScore;

          // 연결 상태 확인
          const connectionResult = await pool.query(
            `SELECT status FROM mentorship_connections 
             WHERE (mentor_id = $1 AND mentee_id = $2) OR (mentor_id = $2 AND mentee_id = $1)`,
            [users[i].id, currentUserId]
          );

          users[i].is_connected =
            connectionResult.rows.length > 0 &&
            connectionResult.rows[0].status === 'accepted';

          // 연결 상태 추가 (pending, accepted, rejected)
          if (connectionResult.rows.length > 0) {
            users[i].connection_status = connectionResult.rows[0].status;
          }
        }

        // 유사도 기준 정렬
        users.sort((a, b) => b.similarity_score - a.similarity_score);
      }
    } else {
      // 비인증 사용자는 태그만 추가
      for (let i = 0; i < users.length; i++) {
        const tagsResult = await pool.query(
          `SELECT t.name
           FROM tags t
           JOIN user_tags ut ON t.id = ut.tag_id
           WHERE ut.user_id = $1`,
          [users[i].id]
        );

        users[i].tags = tagsResult.rows.map((tag) => tag.name);
        users[i].similarity_score = 0;
        users[i].is_connected = false;
      }
    }

    res.status(200).json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('멘토/멘티 검색 에러:', error);
    res.status(500).json({
      success: false,
      message: '멘토/멘티 검색 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 멘토십 연결 요청
export const connectRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { mentor_id, message } = req.body;
    const mentee_id = req.user?.id;

    if (!mentee_id) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 자기 자신에게 요청 불가능
    if (Number(mentor_id) === mentee_id) {
      res.status(400).json({
        success: false,
        message: '자기 자신에게 멘토십을 요청할 수 없습니다',
      });
      return;
    }

    // 요청 대상이 멘토인지 확인 (역할 또는 보조 역할)
    const mentorCheck = await pool.query(
      'SELECT role, secondary_role FROM users WHERE id = $1',
      [mentor_id]
    );

    if (
      mentorCheck.rows.length === 0 ||
      (mentorCheck.rows[0].role !== 'mentor' &&
        mentorCheck.rows[0].secondary_role !== 'mentor')
    ) {
      res.status(400).json({
        success: false,
        message: '유효하지 않은 멘토입니다',
      });
      return;
    }

    // 이미 요청이 존재하는지 확인
    const existingRequest = await pool.query(
      'SELECT * FROM mentorship_connections WHERE mentor_id = $1 AND mentee_id = $2',
      [mentor_id, mentee_id]
    );

    if (existingRequest.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: '이미 해당 멘토에게 연결 요청을 보냈습니다',
      });
      return;
    }

    // 멘토십 연결 요청 생성
    const result = await pool.query(
      `INSERT INTO mentorship_connections 
       (mentor_id, mentee_id, status, message, last_matched, created_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, status`,
      [mentor_id, mentee_id, 'pending', message]
    );

    // 알림 생성
    const userQuery = await pool.query('SELECT name FROM users WHERE id = $1', [
      mentee_id,
    ]);

    const menteeName = userQuery.rows[0].name;

    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, content, reference_id, reference_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        mentor_id,
        'mentorship_request',
        `${menteeName}님이 멘토십 연결을 요청했습니다.`,
        result.rows[0].id,
        'mentorship',
      ]
    );

    res.status(201).json({
      success: true,
      message: '멘토십 연결 요청이 전송되었습니다',
      connection: result.rows[0],
    });
  } catch (error) {
    console.error('멘토십 연결 요청 에러:', error);
    res.status(500).json({
      success: false,
      message: '멘토십 연결 요청 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 멘토십 연결 요청 수락/거절
export const updateConnectionStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const connectionId = req.params.id;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 요청 존재 여부 및 권한 확인
    const connectionCheck = await pool.query(
      'SELECT * FROM mentorship_connections WHERE id = $1',
      [connectionId]
    );

    if (connectionCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '멘토십 연결 요청을 찾을 수 없습니다',
      });
      return;
    }

    const connection = connectionCheck.rows[0];

    // 멘토만 상태 변경 가능
    if (connection.mentor_id !== userId) {
      res.status(403).json({
        success: false,
        message: '이 요청의 상태를 변경할 권한이 없습니다',
      });
      return;
    }

    // 이미 처리된 요청인지 확인
    if (connection.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: '이미 처리된 요청입니다',
      });
      return;
    }

    // 상태 업데이트
    await pool.query(
      'UPDATE mentorship_connections SET status = $1, last_matched = NOW() WHERE id = $2',
      [status, connectionId]
    );

    const action = status === 'accepted' ? '수락' : '거절';

    // 알림 생성
    const mentorQuery = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    const mentorName = mentorQuery.rows[0].name;

    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, content, reference_id, reference_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        connection.mentee_id,
        'mentorship_request',
        `${mentorName}님이 멘토십 연결 요청을 ${action}했습니다.`,
        connectionId,
        'mentorship',
      ]
    );

    // 요청이 수락된 경우, 채팅방 생성
    if (status === 'accepted') {
      const menteeQuery = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [connection.mentee_id]
      );

      const menteeName = menteeQuery.rows[0].name;

      // 채팅방 생성
      const chatRoomResult = await pool.query(
        `INSERT INTO chat_rooms (name, type, mentorship_id, created_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING id`,
        [
          `${mentorName}와 ${menteeName}의 멘토십 채팅방`,
          'mentorship',
          connectionId,
        ]
      );

      const chatRoomId = chatRoomResult.rows[0].id;

      // 참가자 추가
      await pool.query(
        'INSERT INTO chat_room_participants (chat_room_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [chatRoomId, connection.mentor_id]
      );

      await pool.query(
        'INSERT INTO chat_room_participants (chat_room_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [chatRoomId, connection.mentee_id]
      );
    }

    res.status(200).json({
      success: true,
      message: `멘토십 연결 요청이 ${action}되었습니다`,
    });
  } catch (error) {
    console.error('멘토십 연결 상태 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '멘토십 연결 상태 업데이트 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 멘토십 연결 요청 목록
export const getConnectionRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 요청 수 조회
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM mentorship_connections 
       WHERE mentor_id = $1 AND status = $2`,
      [userId, status]
    );

    const total = parseInt(countResult.rows[0].count);

    // 요청 목록 조회
    const connectionsResult = await pool.query(
      `SELECT mc.id, mc.status, mc.message, mc.created_at,
              m.id as mentor_id, m.name as mentor_name, m.expertise as mentor_expertise, m.profession as mentor_profession,
              e.id as mentee_id, e.name as mentee_name, e.expertise as mentee_expertise, e.profession as mentee_profession
       FROM mentorship_connections mc
       JOIN users m ON mc.mentor_id = m.id
       JOIN users e ON mc.mentee_id = e.id
       WHERE mc.mentor_id = $1 AND mc.status = $2
       ORDER BY mc.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, status, limit, offset]
    );

    const connections = connectionsResult.rows.map((row) => ({
      id: row.id,
      mentor: {
        id: row.mentor_id,
        name: row.mentor_name,
        expertise: row.mentor_expertise,
        profession: row.mentor_profession,
      },
      mentee: {
        id: row.mentee_id,
        name: row.mentee_name,
        expertise: row.mentee_expertise,
        profession: row.mentee_profession,
      },
      status: row.status,
      message: row.message,
      created_at: row.created_at,
    }));

    res.status(200).json({
      connections,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('멘토십 연결 요청 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '멘토십 연결 요청 목록 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 내 멘토십 연결 목록
export const getMyConnections = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 연결 수 조회
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM mentorship_connections 
       WHERE (mentor_id = $1 OR mentee_id = $1) AND status = 'accepted'`,
      [userId]
    );

    const total = parseInt(countResult.rows[0].count);

    // 연결 목록 조회
    const connectionsResult = await pool.query(
      `SELECT mc.id, mc.status, mc.created_at,
              m.id as mentor_id, m.name as mentor_name, m.expertise as mentor_expertise, m.profession as mentor_profession,
              e.id as mentee_id, e.name as mentee_name, e.expertise as mentee_expertise, e.profession as mentee_profession,
              (SELECT id FROM chat_rooms WHERE mentorship_id = mc.id LIMIT 1) as chat_room_id
       FROM mentorship_connections mc
       JOIN users m ON mc.mentor_id = m.id
       JOIN users e ON mc.mentee_id = e.id
       WHERE (mc.mentor_id = $1 OR mc.mentee_id = $1) AND mc.status = 'accepted'
       ORDER BY mc.last_matched DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const connections = connectionsResult.rows.map((row) => ({
      id: row.id,
      mentor: {
        id: row.mentor_id,
        name: row.mentor_name,
        expertise: row.mentor_expertise,
        profession: row.mentor_profession,
      },
      mentee: {
        id: row.mentee_id,
        name: row.mentee_name,
        expertise: row.mentee_expertise,
        profession: row.mentee_profession,
      },
      status: row.status,
      created_at: row.created_at,
      chat_room_id: row.chat_room_id,
    }));

    res.status(200).json({
      connections,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('내 멘토십 연결 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '내 멘토십 연결 목록 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 추천 멘토 조회
export const getRecommendedMentors = async (
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

    // 사용자가 멘티인지 확인
    const userCheck = await pool.query(
      'SELECT role, secondary_role FROM users WHERE id = $1',
      [userId]
    );

    if (
      userCheck.rows.length === 0 ||
      (userCheck.rows[0].role !== 'mentee' &&
        userCheck.rows[0].secondary_role !== 'mentee')
    ) {
      res.status(400).json({
        success: false,
        message: '멘티만 추천 멘토를 조회할 수 있습니다',
      });
      return;
    }

    // 추천 멘토 조회
    const recommendedMentors = await findMentorForMentee(userId);

    // 상위 5명만 반환
    const topMentors = recommendedMentors.slice(0, 5);

    res.status(200).json({
      recommended_mentors: topMentors,
    });
  } catch (error) {
    console.error('추천 멘토 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '추천 멘토 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
