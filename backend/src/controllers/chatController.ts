import { Request, Response } from 'express';
import pool from '../config/database';

// Request 타입 확장
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// 채팅방 목록 조회
export const getChatRooms = async (
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

    // 사용자가 참여 중인 채팅방 목록 조회
    const chatRoomsQuery = `
      SELECT cr.id, cr.name, cr.type, cr.event_id, cr.mentorship_id, cr.created_at,
             (SELECT COUNT(*) FROM messages m 
              JOIN chat_room_participants crp ON m.chat_room_id = crp.chat_room_id 
              WHERE m.chat_room_id = cr.id AND crp.user_id = $1 AND m.created_at > crp.last_read_at) as unread_count,
             (SELECT m.content FROM messages m 
              WHERE m.chat_room_id = cr.id 
              ORDER BY m.created_at DESC LIMIT 1) as last_message_content,
             (SELECT m.sender_id FROM messages m 
              WHERE m.chat_room_id = cr.id 
              ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_id,
             (SELECT u.name FROM messages m 
              JOIN users u ON m.sender_id = u.id
              WHERE m.chat_room_id = cr.id 
              ORDER BY m.created_at DESC LIMIT 1) as last_message_sender_name,
             (SELECT m.created_at FROM messages m 
              WHERE m.chat_room_id = cr.id 
              ORDER BY m.created_at DESC LIMIT 1) as last_message_created_at
      FROM chat_rooms cr
      JOIN chat_room_participants crp ON cr.id = crp.chat_room_id
      WHERE crp.user_id = $1
      ORDER BY last_message_created_at DESC NULLS LAST
    `;

    const chatRoomsResult = await pool.query(chatRoomsQuery, [userId]);

    const chatRooms = chatRoomsResult.rows.map((room) => {
      const lastMessage = room.last_message_content
        ? {
            content: room.last_message_content,
            sender_id: room.last_message_sender_id,
            sender_name: room.last_message_sender_name,
            created_at: room.last_message_created_at,
          }
        : null;

      return {
        id: room.id,
        name: room.name,
        type: room.type,
        event_id: room.event_id,
        mentorship_id: room.mentorship_id,
        last_message: lastMessage,
        unread_count: parseInt(room.unread_count) || 0,
        created_at: room.created_at,
      };
    });

    res.status(200).json({
      chat_rooms: chatRooms,
    });
  } catch (error) {
    console.error('채팅방 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 목록 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 채팅방 참가
export const joinChatRoom = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const chatRoomId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 채팅방 존재 여부 확인
    const chatRoomCheck = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1',
      [chatRoomId]
    );

    if (chatRoomCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다',
      });
      return;
    }

    const chatRoom = chatRoomCheck.rows[0];

    // 이벤트 채팅방인 경우, 이벤트 참가자인지 확인
    if (chatRoom.type === 'event' && chatRoom.event_id) {
      const attendeeCheck = await pool.query(
        'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [chatRoom.event_id, userId]
      );

      if (attendeeCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: '이 이벤트의 참가자만 채팅방에 참가할 수 있습니다',
        });
        return;
      }
    }

    // 멘토십 채팅방인 경우, 멘토십 연결 멤버인지 확인
    if (chatRoom.type === 'mentorship' && chatRoom.mentorship_id) {
      const mentorshipCheck = await pool.query(
        'SELECT * FROM mentorship_connections WHERE id = $1 AND (mentor_id = $2 OR mentee_id = $2) AND status = $3',
        [chatRoom.mentorship_id, userId, 'accepted']
      );

      if (mentorshipCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message: '해당 멘토십 연결의 멤버만 채팅방에 참가할 수 있습니다',
        });
        return;
      }
    }

    // 이미 참가 중인지 확인
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    if (participantCheck.rows.length > 0) {
      // 이미 참가 중이면 마지막 읽은 시간만 업데이트
      await pool.query(
        'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
        [chatRoomId, userId]
      );
    } else {
      // 참가자 추가
      await pool.query(
        'INSERT INTO chat_room_participants (chat_room_id, user_id, last_read_at, created_at) VALUES ($1, $2, NOW(), NOW())',
        [chatRoomId, userId]
      );
    }

    res.status(200).json({
      success: true,
      message: '채팅방에 참가했습니다',
      chat_room: {
        id: chatRoom.id,
        name: chatRoom.name,
        type: chatRoom.type,
      },
    });
  } catch (error) {
    console.error('채팅방 참가 에러:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 참가 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 채팅방 메시지 목록 조회
export const getChatMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const chatRoomId = req.params.id;
    const userId = req.user?.id;
    const { before, limit = 20 } = req.query;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 채팅방 참가자인지 확인
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    if (participantCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: '이 채팅방에 접근할 권한이 없습니다',
      });
      return;
    }

    // 메시지 조회 쿼리 생성
    let messagesQuery = `
      SELECT m.id, m.chat_room_id, m.content, m.created_at, m.is_read, 
             u.id as sender_id, u.name as sender_name, u.profile_image_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_room_id = $1
    `;

    const queryParams = [chatRoomId];

    // 특정 메시지 이전 메시지 요청인 경우
    if (before) {
      messagesQuery += ` AND m.id < $2`;
      queryParams.push(before as string);
    }

    // 정렬 및 제한
    messagesQuery += ` ORDER BY m.created_at DESC LIMIT $${
      queryParams.length + 1
    }`;
    queryParams.push(String(Number(limit)));

    const messagesResult = await pool.query(messagesQuery, queryParams);

    // 결과 가공
    const messages = messagesResult.rows.map((msg) => ({
      id: msg.id,
      chat_room_id: msg.chat_room_id,
      sender: {
        id: msg.sender_id,
        name: msg.sender_name,
        profile_image_url: msg.profile_image_url,
      },
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
    }));

    // 추가 메시지 있는지 확인
    const hasMore = messages.length === Number(limit);

    // 참가자의 마지막 읽은 시간 업데이트
    await pool.query(
      'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    res.status(200).json({
      messages,
      has_more: hasMore,
    });
  } catch (error) {
    console.error('채팅 메시지 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '채팅 메시지 목록 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 메시지 전송
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const chatRoomId = req.params.id;
    const userId = req.user?.id;
    const { content } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 채팅방 참가자인지 확인
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    if (participantCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: '이 채팅방에 메시지를 보낼 권한이 없습니다',
      });
      return;
    }

    // 메시지 저장
    const messageResult = await pool.query(
      `INSERT INTO messages (chat_room_id, sender_id, content, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())
       RETURNING id, chat_room_id, sender_id, content, is_read, created_at`,
      [chatRoomId, userId, content]
    );

    const message = messageResult.rows[0];

    // 발신자 정보 조회
    const senderQuery = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    // 다른 참가자들에게 알림 생성
    const otherParticipantsQuery = await pool.query(
      'SELECT user_id FROM chat_room_participants WHERE chat_room_id = $1 AND user_id != $2',
      [chatRoomId, userId]
    );

    for (const participant of otherParticipantsQuery.rows) {
      await pool.query(
        `INSERT INTO notifications (user_id, type, content, reference_id, reference_type, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          participant.user_id,
          'message',
          `${senderQuery.rows[0].name}님이 새 메시지를 보냈습니다.`,
          message.id,
          'message',
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: {
        id: message.id,
        chat_room_id: message.chat_room_id,
        sender: {
          id: userId,
          name: senderQuery.rows[0].name,
        },
        content: message.content,
        is_read: message.is_read,
        created_at: message.created_at,
      },
    });
  } catch (error) {
    console.error('메시지 전송 에러:', error);
    res.status(500).json({
      success: false,
      message: '메시지 전송 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 채팅방 메시지 읽음 처리
export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const chatRoomId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 채팅방 참가자인지 확인
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    if (participantCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: '이 채팅방에 접근할 권한이 없습니다',
      });
      return;
    }

    // 마지막 읽은 시간 업데이트
    await pool.query(
      'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    res.status(200).json({
      success: true,
      message: '메시지가 읽음 처리되었습니다',
    });
  } catch (error) {
    console.error('메시지 읽음 처리 에러:', error);
    res.status(500).json({
      success: false,
      message: '메시지 읽음 처리 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
