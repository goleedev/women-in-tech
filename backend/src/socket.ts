import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import pool from './config/database';

export const setupSocketServer = (server: Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000, // 60초 ping 타임아웃
    pingInterval: 25000, // 25초마다 ping
  });

  // 인증 미들웨어
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('인증이 필요합니다'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number;
      };

      // 사용자 정보 조회
      const result = await pool.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [decoded.id]
      );

      if (result.rows.length === 0) {
        return next(new Error('사용자를 찾을 수 없습니다'));
      }

      // socket 객체에 사용자 정보 저장
      socket.data.user = result.rows[0];
      next();
    } catch (error) {
      console.error('소켓 인증 오류:', error);
      return next(new Error('인증에 실패했습니다'));
    }
  });

  // 연결 이벤트 처리
  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`사용자 연결됨: ${user.name} (ID: ${user.id})`);

    // 인증 성공 알림
    socket.emit('auth_success', { message: 'Socket 인증 성공' });

    // 채팅방 참가 - 재연결 시에도 기존 참가 채팅방 복원을 위해 배열로 관리
    const joinedRooms = new Set<string>();

    socket.on('join-room', async (data) => {
      try {
        const roomId = data.roomId;
        const roomName = `room:${roomId}`;

        // 이미 참가한 채팅방이면 무시
        if (joinedRooms.has(roomName)) {
          console.log(
            `사용자 ${user.name}(${user.id})는 이미 채팅방 ${roomId}에 참가되어 있음`
          );
          return;
        }

        // 채팅방 존재 및 접근 권한 확인
        const roomCheck = await pool.query(
          `SELECT cr.*, e.id as event_id, mc.id as mentorship_id
           FROM chat_rooms cr
           LEFT JOIN events e ON cr.event_id = e.id
           LEFT JOIN mentorship_connections mc ON cr.mentorship_id = mc.id
           WHERE cr.id = $1`,
          [roomId]
        );

        if (roomCheck.rows.length === 0) {
          socket.emit('error', { message: '채팅방을 찾을 수 없습니다' });
          return;
        }

        const room = roomCheck.rows[0];

        // 이벤트 채팅방인 경우 참가 확인
        if (room.type === 'event' && room.event_id) {
          const attendeeCheck = await pool.query(
            'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
            [room.event_id, user.id]
          );

          if (attendeeCheck.rows.length === 0) {
            socket.emit('error', {
              message: '이 이벤트의 참가자만 채팅방에 참가할 수 있습니다',
            });
            return;
          }
        }

        // 멘토십 채팅방인 경우 멤버 확인
        if (room.type === 'mentorship' && room.mentorship_id) {
          const mentorshipCheck = await pool.query(
            'SELECT * FROM mentorship_connections WHERE id = $1 AND (mentor_id = $2 OR mentee_id = $2) AND status = $3',
            [room.mentorship_id, user.id, 'accepted']
          );

          if (mentorshipCheck.rows.length === 0) {
            socket.emit('error', {
              message: '해당 멘토십 연결의 멤버만 채팅방에 참가할 수 있습니다',
            });
            return;
          }
        }

        // 참가자 등록
        const participantCheck = await pool.query(
          'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
          [roomId, user.id]
        );

        if (participantCheck.rows.length === 0) {
          await pool.query(
            'INSERT INTO chat_room_participants (chat_room_id, user_id, last_read_at, created_at) VALUES ($1, $2, NOW(), NOW())',
            [roomId, user.id]
          );
        } else {
          await pool.query(
            'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
            [roomId, user.id]
          );
        }

        // Socket.io 채팅방 참가
        socket.join(roomName);
        joinedRooms.add(roomName);

        console.log(
          `사용자 ${user.name}(${user.id})가 채팅방 ${roomId}에 참가함`
        );

        // 이전 메시지 조회 (최근 20개)
        const messagesResult = await pool.query(
          `SELECT m.id, m.content, m.created_at, m.chat_room_id,
                  u.id as sender_id, u.name as sender_name, u.profile_image_url
           FROM messages m
           JOIN users u ON m.sender_id = u.id
           WHERE m.chat_room_id = $1
           ORDER BY m.created_at DESC
           LIMIT 20`,
          [roomId]
        );

        const messages = messagesResult.rows
          .map((msg) => ({
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            chat_room_id: msg.chat_room_id,
            room_id: msg.chat_room_id, // client 일관성을 위해 추가
            sender: {
              id: msg.sender_id,
              name: msg.sender_name,
              profile_image_url: msg.profile_image_url,
            },
          }))
          .reverse();

        socket.emit('room-joined', { roomId, messages });

        // 참가 알림
        socket.to(roomName).emit('user-joined', {
          user: {
            id: user.id,
            name: user.name,
          },
          roomId,
        });
      } catch (error) {
        console.error('채팅방 참가 에러:', error);
        socket.emit('error', { message: '채팅방 참가 중 오류가 발생했습니다' });
      }
    });

    // 메시지 전송
    socket.on('send-message', async (data) => {
      try {
        const { roomId, content } = data;
        const roomName = `room:${roomId}`;

        // 채팅방 참가자 확인
        const participantCheck = await pool.query(
          'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
          [roomId, user.id]
        );

        if (participantCheck.rows.length === 0) {
          socket.emit('error', {
            message: '이 채팅방에 메시지를 보낼 권한이 없습니다',
          });
          return;
        }

        // 메시지 저장
        const messageResult = await pool.query(
          `INSERT INTO messages (chat_room_id, sender_id, content, is_read, created_at)
           VALUES ($1, $2, $3, false, NOW())
           RETURNING id, chat_room_id, sender_id, content, is_read, created_at`,
          [roomId, user.id, content]
        );

        const message = messageResult.rows[0];

        console.log(
          `사용자 ${user.name}(${
            user.id
          })가 채팅방 ${roomId}에 메시지 전송: ${content.substring(0, 30)}${
            content.length > 30 ? '...' : ''
          }`
        );

        // 메시지 브로드캐스트 - room_id 필드 추가 (클라이언트 일관성)
        const messageToSend = {
          id: message.id,
          content: message.content,
          created_at: message.created_at,
          chat_room_id: message.chat_room_id,
          room_id: message.chat_room_id,
          sender: {
            id: user.id,
            name: user.name,
            profile_image_url: user.profile_image_url || null,
          },
          _messageId: data._messageId, // 클라이언트 추적용
        };

        const socketsInRoom = await io.in(roomName).fetchSockets();
        console.log(`채팅방 ${roomId}에 있는 소켓 수: ${socketsInRoom.length}`);

        for (const clientSocket of socketsInRoom) {
          clientSocket.emit('new-message', messageToSend);
          console.log(`소켓 ${clientSocket.id}에 메시지 전송 완료`);
        }

        // 다른 참가자들에게 알림 생성
        const otherParticipantsQuery = await pool.query(
          'SELECT user_id FROM chat_room_participants WHERE chat_room_id = $1 AND user_id != $2',
          [roomId, user.id]
        );

        for (const participant of otherParticipantsQuery.rows) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, content, reference_id, reference_type, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              participant.user_id,
              'message',
              `${user.name}님이 새 메시지를 보냈습니다.`,
              message.id,
              'message',
            ]
          );

          // 해당 사용자가 온라인이면 실시간 알림 전송
          const onlineUser = Array.from(io.sockets.sockets.values()).find(
            (s) => s.data.user && s.data.user.id === participant.user_id
          );

          if (onlineUser) {
            onlineUser.emit('notification', {
              type: 'message',
              content: `${user.name}님이 새 메시지를 보냈습니다.`,
              reference_id: message.id,
              reference_type: 'message',
            });
          }
        }
      } catch (error) {
        console.error('메시지 전송 에러:', error);
        socket.emit('error', { message: '메시지 전송 중 오류가 발생했습니다' });
      }
    });

    // 메시지 읽음 처리
    socket.on('mark-read', async (data) => {
      try {
        const roomId = data.roomId;
        const roomName = `room:${roomId}`;

        await pool.query(
          'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
          [roomId, user.id]
        );

        socket.to(roomName).emit('messages-read', {
          user_id: user.id,
          room_id: roomId,
        });
      } catch (error) {
        console.error('메시지 읽음 처리 에러:', error);
      }
    });

    // 타이핑 상태 전송
    socket.on('typing', (data) => {
      const roomId = data.roomId;
      const roomName = `room:${roomId}`;

      socket.to(roomName).emit('user-typing', {
        user_id: user.id,
        user_name: user.name,
        room_id: roomId,
      });
    });

    // 채팅방 나가기
    socket.on('leave-room', (data) => {
      const roomId = data.roomId;
      const roomName = `room:${roomId}`;

      socket.leave(roomName);
      joinedRooms.delete(roomName);

      socket.to(roomName).emit('user-left', {
        user_id: user.id,
        user_name: user.name,
        room_id: roomId,
      });

      console.log(
        `사용자 ${user.name}(${user.id})가 채팅방 ${roomId}에서 나감`
      );
    });

    // 연결 종료
    socket.on('disconnect', () => {
      console.log(`사용자 연결 종료: ${user.name}(${user.id})`);

      // 모든 참가 채팅방에서 사용자 나가기 알림
      for (const roomName of joinedRooms) {
        const roomId = roomName.split(':')[1];
        socket.to(roomName).emit('user-left', {
          user_id: user.id,
          user_name: user.name,
          room_id: roomId,
        });
      }
    });
  });

  return io;
};
