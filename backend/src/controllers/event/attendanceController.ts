import { RequestHandler, Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the event attendance controller
export const attendEvent: RequestHandler = async (
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
    const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1', [
      eventId,
    ]);

    // Check if the event exists
    if (eventCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: '⚠️ Event not found' });

      return;
    }

    // Check if the event is already full
    const attendeeCheck = await pool.query(
      'SELECT * FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    // Check if the user is already registered for the event
    if (attendeeCheck.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: '⚠️ You are already registered for this event',
      });

      return;
    }

    // Query to check the current number of attendees
    await pool.query(
      'INSERT INTO event_attendees (event_id, user_id, status) VALUES ($1, $2, $3)',
      [eventId, userId, 'registered']
    );

    // Query to update the event status
    res.status(200).json({
      success: true,
      message: '✨ Successfully registered for the event',
      status: 'registered',
    });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while registering for the event:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while registering for the event',
    });
  }
};

// Set up the event attendance cancellation controller
export const cancelEventAttendance: RequestHandler = async (
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
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );

    // Update the event status to 'cancelled'
    res
      .status(200)
      .json({ success: true, message: '✨ Successfully cancel the event' });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while canceling the event:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while canceling the event',
    });
  }
};
