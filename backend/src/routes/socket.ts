import { Server } from 'http';
import { Server as SocketServer } from 'socket.io';
import pool from '../config/db';

// 소켓 인터페이스 정의
interface UserSocket {
  userId: number;
  socketId: string;
}

// 현재 연결된 사용자 관리
const connectedUsers: Map<number, string> = new Map();

export function initializeSocketServer(server: Server): SocketServer {
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: any) => {
    console.log('New client connected', socket.id);

    // 사용자 인증 및 연결 관리
    socket.on('authenticate', (userData: { userId: number }) => {
      const { userId } = userData;

      if (userId) {
        // 사용자 ID와 소켓 ID 맵핑
        connectedUsers.set(userId, socket.id);
        socket.join(`user:${userId}`); // 개인 알림용 채널
        console.log(`User ${userId} authenticated with socket ${socket.id}`);
      }
    });

    // 이벤트 채팅방 참여
    socket.on('join-event-chat', (eventId: number) => {
      socket.join(`event:${eventId}`);
      console.log(`Socket ${socket.id} joined event chat: ${eventId}`);
    });

    // 개인 채팅방 참여
    socket.on('join-private-chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`Socket ${socket.id} joined private chat: ${chatId}`);
    });

    // 채팅 메시지 처리
    socket.on(
      'chat-message',
      async (data: {
        type: 'event' | 'private';
        senderId: number;
        receiverId?: number;
        eventId?: number;
        content: string;
      }) => {
        try {
          const { type, senderId, content } = data;

          // 메시지 저장 및 브로드캐스트
          if (type === 'event' && data.eventId) {
            // 이벤트 채팅 메시지 저장
            const result = await pool.query(
              `INSERT INTO post_event_chat (event_id, user_id, content) 
             VALUES ($1, $2, $3) RETURNING *`,
              [data.eventId, senderId, content]
            );

            // 보낸 사람 정보 가져오기
            const sender = await pool.query(
              'SELECT name FROM users WHERE id = $1',
              [senderId]
            );

            const messageData = {
              ...result.rows[0],
              sender_name: sender.rows[0]?.name || 'Unknown',
            };

            // 이벤트 채팅방에 메시지 브로드캐스트
            io.to(`event:${data.eventId}`).emit('event-message', messageData);
          } else if (type === 'private' && data.receiverId) {
            // 개인 채팅 메시지 저장
            const chatId = [senderId, data.receiverId].sort().join('-');
            const result = await pool.query(
              `INSERT INTO messages (sender_id, receiver_id, content) 
             VALUES ($1, $2, $3) RETURNING *`,
              [senderId, data.receiverId, content]
            );

            // 보낸 사람 정보 가져오기
            const sender = await pool.query(
              'SELECT name FROM users WHERE id = $1',
              [senderId]
            );

            const messageData = {
              ...result.rows[0],
              sender_name: sender.rows[0]?.name || 'Unknown',
            };

            // 채팅방에 메시지 브로드캐스트
            io.to(`chat:${chatId}`).emit('private-message', messageData);

            // 수신자가 온라인이면 알림 보내기
            const receiverSocketId = connectedUsers.get(data.receiverId);
            if (receiverSocketId) {
              io.to(`user:${data.receiverId}`).emit('notification', {
                type: 'message',
                senderId,
                senderName: messageData.sender_name,
                content:
                  content.substring(0, 50) + (content.length > 50 ? '...' : ''),
              });
            }

            // 알림 저장
            await pool.query(
              `INSERT INTO notifications (user_id, type, message) 
             VALUES ($1, $2, $3)`,
              [
                data.receiverId,
                'message',
                `New message from ${messageData.sender_name}`,
              ]
            );
          }
        } catch (error) {
          console.error('Error in chat-message handler:', error);
        }
      }
    );

    // 멘토십 요청 알림
    socket.on(
      'mentorship-request',
      async (data: { menteeId: number; mentorId: number }) => {
        try {
          const { menteeId, mentorId } = data;

          // 요청자(멘티) 정보 가져오기
          const mentee = await pool.query(
            'SELECT name FROM users WHERE id = $1',
            [menteeId]
          );

          const menteeName = mentee.rows[0]?.name || 'A user';

          // 알림 메시지 생성
          const notificationMessage = `${menteeName} has requested to connect with you as a mentee`;

          // 알림 저장
          await pool.query(
            `INSERT INTO notifications (user_id, type, message) 
           VALUES ($1, $2, $3)`,
            [mentorId, 'mentor_request', notificationMessage]
          );

          // 멘토가 온라인이면 실시간 알림 전송
          const mentorSocketId = connectedUsers.get(mentorId);
          if (mentorSocketId) {
            io.to(`user:${mentorId}`).emit('notification', {
              type: 'mentor_request',
              from: menteeId,
              fromName: menteeName,
              message: notificationMessage,
            });
          }
        } catch (error) {
          console.error('Error in mentorship-request handler:', error);
        }
      }
    );

    // 연결 해제
    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);

      // 연결 해제된 사용자 제거
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });

  return io;
}

// 특정 사용자에게 알림 전송하는 함수 (외부에서 호출 가능)
export function sendNotificationToUser(
  io: SocketServer,
  userId: number,
  notification: { type: string; message: string; data?: any }
) {
  io.to(`user:${userId}`).emit('notification', notification);
}
