import { Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the get chat messages controller
export const getChatMessages = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Set up the chat room ID from the request
    const chatRoomId = req.params.id;
    // Set up the user ID from the request
    const userId = req.user?.id;

    // Check if user is authenticated
    const { before, limit = 20 } = req.query;

    // Check if the chat room ID is valid
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Check if the chat room ID is valid
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    // Check if the user is a participant
    if (participantCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: '⚠️ You are not a participant of this chat room',
      });

      return;
    }

    // Query to get chat messages
    let messagesQuery = `
      SELECT m.id, m.chat_room_id, m.content, m.created_at, m.is_read, 
             u.id as sender_id, u.name as sender_name, u.profile_image_url
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.chat_room_id = $1
    `;

    // Add the before condition if provided
    const queryParams = [chatRoomId];

    // Check if before is provided
    if (before) {
      messagesQuery += ` AND m.id < $2`;
      queryParams.push(before as string);
    }

    // Add the limit condition
    messagesQuery += ` ORDER BY m.created_at DESC LIMIT $${
      queryParams.length + 1
    }`;
    queryParams.push(String(Number(limit)));

    // Execute the query
    const messagesResult = await pool.query(messagesQuery, queryParams);

    // Check if there are messages
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

    // Check if there are more messages
    const hasMore = messages.length === Number(limit);

    // Update the last read time for the user
    await pool.query(
      'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    // Return the messages
    res.status(200).json({
      messages,
      has_more: hasMore,
    });
  } catch (error: any) {
    // Return an error when there is an issue
    console.error('⚠️ Error while loading messages:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while loading messages',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the send message controller
export const sendMessage = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Set up the chat room ID from the request
    const chatRoomId = req.params.id;
    // Set up the user ID from the request
    const userId = req.user?.id;

    // Set up content from the request body
    const { content } = req.body;

    // Check if the user id is provided
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Check if participant ID is provided
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    // Check if the user is a participant
    if (participantCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: '⚠️ You are not a participant of this chat room',
      });

      return;
    }

    // Save the message to the database
    const messageResult = await pool.query(
      `INSERT INTO messages (chat_room_id, sender_id, content, is_read, created_at)
       VALUES ($1, $2, $3, false, NOW())
       RETURNING id, chat_room_id, sender_id, content, is_read, created_at`,
      [chatRoomId, userId, content]
    );

    // Check if the message exists
    const message = messageResult.rows[0];

    // Query to get the sender's name
    const senderQuery = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    // Query to get other participants
    const otherParticipantsQuery = await pool.query(
      'SELECT user_id FROM chat_room_participants WHERE chat_room_id = $1 AND user_id != $2',
      [chatRoomId, userId]
    );

    // Notify other participants
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

    // Return the message details
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
  } catch (error: any) {
    // Return an error when there is an issue
    console.error('⚠️ Error while sending message:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while sending message',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the mark messages as read controller
export const markMessagesAsRead = async (
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

    // Check if the participant ID is provided
    const participantCheck = await pool.query(
      'SELECT * FROM chat_room_participants WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    // Check if the user is a participant
    if (participantCheck.rows.length === 0) {
      res.status(403).json({
        success: false,
        message: '⚠️ You are not a participant of this chat room',
      });

      return;
    }

    // Update the last read time for the user
    await pool.query(
      'UPDATE chat_room_participants SET last_read_at = NOW() WHERE chat_room_id = $1 AND user_id = $2',
      [chatRoomId, userId]
    );

    // Update the read status of messages
    res.status(200).json({
      success: true,
      message: '✨ Messages marked as read successfully',
    });
  } catch (error: any) {
    // Return an error when there is an issue
    console.error('⚠️ Error while marking messages as read:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while marking messages as read',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
