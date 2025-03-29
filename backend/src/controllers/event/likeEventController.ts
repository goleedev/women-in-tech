import { RequestHandler, Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the event like controller
export const likeEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the event ID and user ID from the request
    const eventId = req.params.id;
    const userId = req.user?.id;

    // Check if the user is authenticated
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: '⚠️ Authentication required' });

      return;
    }

    // Check if the event ID is valid
    await pool.query(
      'INSERT INTO event_likes (event_id, user_id) VALUES ($1, $2)',
      [eventId, userId]
    );

    // Update the event status to 'liked'
    res
      .status(200)
      .json({ success: true, message: '✨ Successfully liked the event' });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while liking the event:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while liking the event',
    });
  }
};

// Set up the event unlike controller
export const unlikeEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the event ID and user ID from the request
    const eventId = req.params.id;
    const userId = req.user?.id;

    // Check if the user is authenticated
    if (!userId) {
      res
        .status(401)
        .json({ success: false, message: '⚠️ Authentication required' });

      return;
    }

    // Check if the event ID is valid
    await pool.query(
      'DELETE FROM event_likes WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    // Update the event status to 'unliked'
    res
      .status(200)
      .json({ success: true, message: '✨ Successfully unliked the event' });
  } catch (error) {
    // Handle errors
    console.error('⚠️ Error while unliking the event:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while unliking the event',
    });
  }
};

// Set up the event like list controller
export const getLikedEvents: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
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

    // Get the pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Query to get the total number of liked events
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM event_likes WHERE user_id = $1',
      [userId]
    );

    // Get the total number of liked events
    const total = parseInt(countResult.rows[0].count);

    // Query to get the liked events
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

    // Get the liked events
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

    // Return the liked events
    res.status(200).json({
      events,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while getting liked events:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting liked events',
    });
  }
};
