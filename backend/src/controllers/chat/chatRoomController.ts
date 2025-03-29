import { Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the chat room controller
export const getChatRooms = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Set up the user ID from the request
    const userId = req.user?.id;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Query to get chat rooms for the user
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

    // Execute the query
    const chatRoomsResult = await pool.query(chatRoomsQuery, [userId]);

    // Check if there are chat rooms
    const chatRooms = chatRoomsResult.rows.map((room) => {
      // Format the last message if it exists
      const lastMessage = room.last_message_content
        ? {
            content: room.last_message_content,
            sender_id: room.last_message_sender_id,
            sender_name: room.last_message_sender_name,
            created_at: room.last_message_created_at,
          }
        : null;

      // Return the formatted chat room
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
  } catch (error: any) {
    // Return an error when there is an issue
    console.error('⚠️ Error while retrieving chat rooms:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while retrieving chat rooms',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the join chat room controller
export const joinChatRoom = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Set up the chat room ID from the request
    const chatRoomId = req.params.id;
    // Set up the user ID from the request
    const userId = req.user?.id;

    // Check if user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Check if the chat room ID is valid
    const chatRoomCheck = await pool.query(
      'SELECT * FROM chat_rooms WHERE id = $1',
      [chatRoomId]
    );

    // Check if the chat room exists
    if (chatRoomCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ Chat room not found',
      });
      return;
    }

    // Get the chat room details
    const chatRoom = chatRoomCheck.rows[0];

    // Check if the user is already a participant when event chat room
    if (chatRoom.type === 'event' && chatRoom.event_id) {
      // Check if the user is an attendee of the event
      const attendeeCheck = await pool.query(
        'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
        [chatRoom.event_id, userId]
      );

      // Check if the user is an attendee
      if (attendeeCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message:
            '⚠️ You must be an attendee of the event to join this chat room',
        });

        return;
      }
    }

    // Check if the user is already a participant when mentorship chat room
    if (chatRoom.type === 'mentorship' && chatRoom.mentorship_id) {
      // Check if the user is a mentor or mentee of the mentorship
      const mentorshipCheck = await pool.query(
        'SELECT * FROM mentorship_connections WHERE id = $1 AND (mentor_id = $2 OR mentee_id = $2) AND status = $3',
        [chatRoom.mentorship_id, userId, 'accepted']
      );

      // Check if the user is a mentor or mentee
      if (mentorshipCheck.rows.length === 0) {
        res.status(403).json({
          success: false,
          message:
            '⚠️ You must be a mentor or mentee of the mentorship to join this chat room',
        });

        return;
      }
    }

    // Check if the user is already a participant
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    if (participantCheck.rows.length > 0) {
      // Update the last read time if already a participant
      await pool.query(
        'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
        [chatRoomId, userId]
      );
    } else {
      // Add the user as a participant if not already a participant
      await pool.query(
        'INSERT INTO chat_room_participants (chat_room_id, user_id, last_read_at, created_at) VALUES ($1, $2, NOW(), NOW())',
        [chatRoomId, userId]
      );
    }

    // Return the chat room details
    res.status(200).json({
      success: true,
      message: '✨ Successfully joined the chat room',
      chat_room: {
        id: chatRoom.id,
        name: chatRoom.name,
        type: chatRoom.type,
      },
    });
  } catch (error: any) {
    // Return an error when there is an issue
    console.error('⚠️ Error while joining the chat room:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while joining the chat room',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
