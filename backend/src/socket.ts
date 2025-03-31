import jwt from 'jsonwebtoken';
import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';

import pool from './database';

const timeout = 60000; // set up for 60s
const interval = 25000; // set up for 25s

// Set up the interface for the socket ID
type ID = {
  id: number;
};

// Set up the interface for the socket error message
enum AuthenticationErrorMessage {
  UNAUTHORIZED = '⚠️ Authentication error',
  NO_USER_FOUND = '⚠️ No User Found',
  SOCKET_ERROR = '⚠️ Socket error',
  NO_CHAT_ROOM_FOUND = '⚠️ No chat room found',
  NOT_AN_ATTENDEE = '⚠️ Only attendees of this event can join the chat room',
  NO_MENTORSHIP_CONNECTION = '⚠️ Only members of this mentorship connection can join the chat room',
  ENTER_ROOM_ERROR = '⚠️ Error entering the chat room',
  NO_CHAT_PERMISSION = '⚠️ You do not have permission to send messages in this chat room',
  SEND_MESSAGE_ERROR = '⚠️ Error sending message',
  MESSAGE_READ_ERROR = '⚠️ Error marking messages as read',
}

// Set up the interface for the socket success message
enum AuthenticationSuccessMessage {
  AUTH_SUCCESS = '✨ Socket authentication success',
}

// Set up the socket server
export const setUpSocket = (server: Server) => {
  const io = new SocketServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: timeout,
    pingInterval: interval,
  });

  // Set up the middleware for socket
  io.use(async (socket, next) => {
    try {
      // Set the token to authenticate
      const token = socket.handshake.auth.token;

      // Check if the token is valid
      if (!token) {
        return next(new Error(AuthenticationErrorMessage.UNAUTHORIZED));
      }

      // Decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as ID;

      // Set the user id
      const result = await pool.query(
        'SELECT id, email, name, role FROM users WHERE id = $1',
        [decoded.id]
      );

      // Check if the user is found
      if (result.rows.length === 0) {
        return next(new Error(AuthenticationErrorMessage.NO_USER_FOUND));
      }

      // Set the user id
      socket.data.user = result.rows[0];

      // Move to the next middleware
      next();
    } catch (error: any) {
      console.error(AuthenticationErrorMessage.SOCKET_ERROR, error.message);

      // Return the error
      return next(new Error(AuthenticationErrorMessage.UNAUTHORIZED));
    }
  });

  // Set up the connection
  io.on('connection', (socket) => {
    const user = socket.data.user;

    // Set up the authentication success
    socket.emit('auth_success', {
      message: AuthenticationSuccessMessage.AUTH_SUCCESS,
    });

    // Set up the constant for joined rooms
    const joinedRooms = new Set<string>();

    // Set up the join room
    socket.on('join-room', async (data: any) => {
      try {
        const roomId = data.roomId;
        const roomName = `room:${roomId}`;

        // Check if the user has joined the room, early return
        if (joinedRooms.has(roomName)) return;

        // Check if the room exists and the user has permission to join the room
        const roomCheck = await pool.query(
          `SELECT cr.*, e.id as event_id, mc.id as mentorship_id
           FROM chat_rooms cr
           LEFT JOIN events e ON cr.event_id = e.id
           LEFT JOIN mentorship_connections mc ON cr.mentorship_id = mc.id
           WHERE cr.id = $1`,
          [roomId]
        );

        // Check if the room exists, return error if not
        if (roomCheck.rows.length === 0) {
          socket.emit('error', {
            message: AuthenticationErrorMessage.NO_CHAT_ROOM_FOUND,
          });

          return;
        }

        // Set up the chat room
        const room = roomCheck.rows[0];

        // Check if the user has permission to join the room
        if (room.type === 'event' && room.event_id) {
          // Check if the user is an attendee
          const attendeeCheck = await pool.query(
            'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
            [room.event_id, user.id]
          );

          // Return error if the user is not an attendee
          if (attendeeCheck.rows.length === 0) {
            socket.emit('error', {
              message: AuthenticationErrorMessage.NOT_AN_ATTENDEE,
            });

            return;
          }
        }

        //  Check if the user has permission to join the room
        if (room.type === 'mentorship' && room.mentorship_id) {
          // Check if mentorship connection exists
          const mentorshipCheck = await pool.query(
            'SELECT * FROM mentorship_connections WHERE id = $1 AND (mentor_id = $2 OR mentee_id = $2) AND status = $3',
            [room.mentorship_id, user.id, 'accepted']
          );

          // Return error if the mentorship connection does not exist
          if (mentorshipCheck.rows.length === 0) {
            socket.emit('error', {
              message: AuthenticationErrorMessage.NO_MENTORSHIP_CONNECTION,
            });

            return;
          }
        }

        // Check if the user is the participant of the room
        const participantCheck = await pool.query(
          'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
          [roomId, user.id]
        );

        if (participantCheck.rows.length === 0) {
          // Insert the user to the chat room participants if the user is not a participant
          await pool.query(
            'INSERT INTO chat_room_participants (chat_room_id, user_id, last_read_at, created_at) VALUES ($1, $2, NOW(), NOW())',
            [roomId, user.id]
          );
        } else {
          // Update the last read at for the user if the user is a participant
          await pool.query(
            'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
            [roomId, user.id]
          );
        }

        // Set to join the room
        socket.join(roomName);

        // Add the room to the joined rooms array
        joinedRooms.add(roomName);

        // Get the last 20 messages of the room
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

        // Set the messages into the formatted array and reverse them
        const messages = messagesResult.rows
          .map((msg) => ({
            id: msg.id,
            content: msg.content,
            created_at: msg.created_at,
            chat_room_id: msg.chat_room_id,
            room_id: msg.chat_room_id,
            sender: {
              id: msg.sender_id,
              name: msg.sender_name,
              profile_image_url: msg.profile_image_url,
            },
          }))
          .reverse();

        // Emit the room joined
        socket.emit('room-joined', { roomId, messages });

        // Emit the user joined to the room
        socket.to(roomName).emit('user-joined', {
          user: {
            id: user.id,
            name: user.name,
          },
          roomId,
        });
      } catch (error: any) {
        console.error(AuthenticationErrorMessage.ENTER_ROOM_ERROR, error);
        socket.emit('error', {
          message: AuthenticationErrorMessage.ENTER_ROOM_ERROR,
        });
      }
    });

    // Set up to send message
    socket.on('send-message', async (data: any) => {
      try {
        // Set up the data
        const { roomId, content } = data;
        const roomName = `room:${roomId}`;

        // Check if the user is the participant of the room
        const participantCheck = await pool.query(
          'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
          [roomId, user.id]
        );

        // Return error if the user is not the participant of the room
        if (participantCheck.rows.length === 0) {
          socket.emit('error', {
            message: AuthenticationErrorMessage.NO_CHAT_PERMISSION,
          });

          return;
        }

        // Insert the message to the database
        const messageResult = await pool.query(
          `INSERT INTO messages (chat_room_id, sender_id, content, is_read, created_at)
           VALUES ($1, $2, $3, false, NOW())
           RETURNING id, chat_room_id, sender_id, content, is_read, created_at`,
          [roomId, user.id, content]
        );

        const message = messageResult.rows[0];

        // Set up the message to send
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
          _messageId: data._messageId, // 클라이언트에서 전송한 메시지 아이디
        };

        // Set up to fetch the sockets in the room
        const socketsInRoom = await io.in(roomName).fetchSockets();

        //  Emit the new message to the sockets in the room
        for (const clientSocket of socketsInRoom) {
          clientSocket.emit('new-message', messageToSend);
        }

        // Set up to send notifications to other participants in the room
        const otherParticipantsQuery = await pool.query(
          'SELECT user_id FROM chat_room_participants WHERE chat_room_id = $1 AND user_id != $2',
          [roomId, user.id]
        );

        // Insert notifications to the database
        for (const participant of otherParticipantsQuery.rows) {
          await pool.query(
            `INSERT INTO notifications (user_id, type, content, reference_id, reference_type, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [
              participant.user_id,
              'message',
              `🕊️ ${user.name} sent a new message`,
              message.id,
              'message',
            ]
          );

          // Send notifications to online users
          const onlineUser = Array.from(io.sockets.sockets.values()).find(
            (so) => so.data.user && so.data.user.id === participant.user_id
          );

          // Emit the notification to the online user
          if (onlineUser) {
            onlineUser.emit('notification', {
              type: 'message',
              content: `🕊️ ${user.name} sent a new message`,
              reference_id: message.id,
              reference_type: 'message',
            });
          }
        }
      } catch (error: any) {
        console.error(AuthenticationErrorMessage.SEND_MESSAGE_ERROR, error);
        socket.emit('error', {
          message: AuthenticationErrorMessage.SEND_MESSAGE_ERROR,
        });
      }
    });

    // Set up messages to mark as read
    socket.on('mark-read', async (data) => {
      try {
        const roomId = data.roomId;
        const roomName = `room:${roomId}`;

        // Update the last read at for the user
        await pool.query(
          'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
          [roomId, user.id]
        );

        // Emit the messages read
        socket.to(roomName).emit('messages-read', {
          user_id: user.id,
          room_id: roomId,
        });
      } catch (error: any) {
        console.error(AuthenticationErrorMessage.MESSAGE_READ_ERROR, error);
      }
    });

    // Set up the status update as typing
    socket.on('typing', (data) => {
      const roomId = data.roomId;
      const roomName = `room:${roomId}`;

      // Emit the user typing
      socket.to(roomName).emit('user-typing', {
        user_id: user.id,
        user_name: user.name,
        room_id: roomId,
      });
    });

    // Set up the status update as left
    socket.on('leave-room', (data) => {
      const roomId = data.roomId;
      const roomName = `room:${roomId}`;

      // Leave the room
      socket.leave(roomName);
      joinedRooms.delete(roomName);

      // Emit the user left
      socket.to(roomName).emit('user-left', {
        user_id: user.id,
        user_name: user.name,
        room_id: roomId,
      });
    });

    // Set up the disconnection
    socket.on('disconnect', () => {
      // Emit the user left to the joined rooms
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
