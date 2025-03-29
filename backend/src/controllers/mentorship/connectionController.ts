import { Response } from 'express';

import pool from '../../database';
import { findMentorForMentee } from '../../utils/mentorship.utils';

import { AuthRequest } from '../../types/auth.type';

// Set up the mentorship connection request controller
export const connectRequest = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the mentor ID and message from the request body
    const { mentor_id, message } = req.body;
    const mentee_id = req.user?.id;

    // Check if the user is authenticated
    if (!mentee_id) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Prevent self-request
    if (Number(mentor_id) === mentee_id) {
      res.status(400).json({
        success: false,
        message: '⚠️ You cannot request yourself',
      });

      return;
    }

    // Check the mentor's role
    const mentorCheck = await pool.query(
      'SELECT role, secondary_role FROM users WHERE id = $1',
      [mentor_id]
    );

    // Check if the mentor exists
    if (
      mentorCheck.rows.length === 0 ||
      (mentorCheck.rows[0].role !== 'mentor' &&
        mentorCheck.rows[0].secondary_role !== 'mentor')
    ) {
      res.status(400).json({
        success: false,
        message: '⚠️ Mentor not found',
      });

      return;
    }

    // Check if request already exists
    const existingRequest = await pool.query(
      'SELECT * FROM mentorship_connections WHERE mentor_id = $1 AND mentee_id = $2',
      [mentor_id, mentee_id]
    );

    if (existingRequest.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: '⚠️ Request already exists',
      });

      return;
    }

    // Add the mentorship connection request to the database
    const result = await pool.query(
      `INSERT INTO mentorship_connections 
       (mentor_id, mentee_id, status, message, last_matched, created_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, status`,
      [mentor_id, mentee_id, 'pending', message]
    );

    // Query to get the mentee's name
    const userQuery = await pool.query('SELECT name FROM users WHERE id = $1', [
      mentee_id,
    ]);

    // Set the mentee's name
    const menteeName = userQuery.rows[0].name;

    // Create a notification for the mentor
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, content, reference_id, reference_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        mentor_id,
        'mentorship_request',
        `🔔 ${menteeName} sent you a mentorship connection request.`,
        result.rows[0].id,
        'mentorship',
      ]
    );

    // Return the connection request result
    res.status(201).json({
      success: true,
      message: '✨ Successfully sent a mentorship connection request',
      connection: result.rows[0],
    });
  } catch (error: any) {
    console.error(
      '⚠️ Error while sending the mentorship connection request:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: '⚠️ Error while sending the mentorship connection request',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the mentorship connection status update controller
export const updateConnectionStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the connection ID and status from the request
    const connectionId = req.params.id;
    const { status } = req.body;
    // Get the user ID from the request
    const userId = req.user?.id;

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Check if connection ID is valid
    const connectionCheck = await pool.query(
      'SELECT * FROM mentorship_connections WHERE id = $1',
      [connectionId]
    );

    // Check if the connection exists
    if (connectionCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ Connection not found',
      });

      return;
    }

    // Get the connection details
    const connection = connectionCheck.rows[0];

    // Mentor can only accept or reject requests
    if (connection.mentor_id !== userId) {
      res.status(403).json({
        success: false,
        message: '⚠️ You have no permission to update this request',
      });

      return;
    }

    // Check if the status is valid
    if (connection.status !== 'pending') {
      res.status(400).json({
        success: false,
        message: '⚠️ Request already processed',
      });

      return;
    }

    // Query to update the connection status
    await pool.query(
      'UPDATE mentorship_connections SET status = $1, last_matched = NOW() WHERE id = $2',
      [status, connectionId]
    );

    // Set the action based on the status
    const action = status === 'accepted' ? 'accepted' : 'rejected';

    // Query to get the mentor's name
    const mentorQuery = await pool.query(
      'SELECT name FROM users WHERE id = $1',
      [userId]
    );

    // Set the mentor's name
    const mentorName = mentorQuery.rows[0].name;

    // Create a notification for the mentee
    await pool.query(
      `INSERT INTO notifications 
       (user_id, type, content, reference_id, reference_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [
        connection.mentee_id,
        'mentorship_request',
        `🔔 ${mentorName} ${action} the request`,
        connectionId,
        'mentorship',
      ]
    );

    // If the request is accepted, create a chat room
    if (status === 'accepted') {
      // Query to get the mentee's name
      const menteeQuery = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [connection.mentee_id]
      );

      // Set the mentee's name
      const menteeName = menteeQuery.rows[0].name;

      // Create a chat room for the mentorship connection
      const chatRoomResult = await pool.query(
        `INSERT INTO chat_rooms (name, type, mentorship_id, created_at) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING id`,
        [
          `Chat room for ${mentorName} and ${menteeName}`,
          'mentorship',
          connectionId,
        ]
      );

      // Check if the chat room was created
      const chatRoomId = chatRoomResult.rows[0].id;

      // Add the mentor and mentee to the chat room participants
      await pool.query(
        'INSERT INTO chat_room_participants (chat_room_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [chatRoomId, connection.mentor_id]
      );

      // Add the mentee to the chat room participants
      await pool.query(
        'INSERT INTO chat_room_participants (chat_room_id, user_id, created_at) VALUES ($1, $2, NOW())',
        [chatRoomId, connection.mentee_id]
      );
    }

    // Return the connection status update result
    res.status(200).json({
      success: true,
      message: `✨ Successfully ${action} the request`,
    });
  } catch (error: any) {
    // Handle errors during connection status update
    console.error(
      '⚠️ Error while updating mentorship connection request:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: '⚠️ Error while updating mentorship connection request',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the mentorship connection requests controller
export const getConnectionRequests = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request
    const userId = req.user?.id;
    // Get the query parameters for connection requests
    const { status = 'pending', page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Get count of connection requests
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM mentorship_connections 
       WHERE mentor_id = $1 AND status = $2`,
      [userId, status]
    );

    // Get the total number of connection requests
    const total = parseInt(countResult.rows[0].count);

    // Query to get connection requests
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

    // Map the connection requests to the response format
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

    // Return the connection requests and pagination data
    res.status(200).json({
      connections,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    // Handle errors during connection requests retrieval
    console.error(
      '⚠️ Error while getting mentorship connection requests list:',
      error
    );

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting mentorship connection requests list',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the mentorship connections controller
export const getMyConnections = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request
    const userId = req.user?.id;
    // Get the query parameters for connections
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Get count of connections
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM mentorship_connections 
       WHERE (mentor_id = $1 OR mentee_id = $1) AND status = 'accepted'`,
      [userId]
    );

    // Get the total number of connections
    const total = parseInt(countResult.rows[0].count);

    // Query to get connections
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

    // Map the connections to the response format
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

    // Return the connections and pagination data
    res.status(200).json({
      connections,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    // Handle errors during connections retrieval
    console.error(
      '⚠️ Error while getting your mentorship connection requests:',
      error
    );

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting your mentorship connection requests',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
