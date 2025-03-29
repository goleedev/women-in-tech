import { Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the notification controller
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request
    const userId = req.user?.id;
    // Get the query parameters for notifications
    const { is_read, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Set up the query to get notifications
    let whereClause = 'WHERE user_id = $1';
    const queryParams = [userId];

    // Add the is_read filter if provided
    if (is_read !== undefined) {
      whereClause += ` AND is_read = $${queryParams.length + 1}`;
      queryParams.push(Number(is_read === 'true'));
    }

    // Get the count of notifications
    const countQuery = `
      SELECT COUNT(*) FROM notifications
      ${whereClause}
    `;

    // Execute the count query
    const countResult = await pool.query(countQuery, queryParams);
    // Get the total number of notifications
    const total = parseInt(countResult.rows[0].count);

    // Get the unread count
    const unreadCountQuery = `
      SELECT COUNT(*) FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;

    // Execute the unread count query
    const unreadCountResult = await pool.query(unreadCountQuery, [userId]);
    // Get the total number of unread notifications
    const unreadCount = parseInt(unreadCountResult.rows[0].count);

    // Set up the query to get notifications
    queryParams.push(Number(limit));
    queryParams.push(offset);

    // Get the notifications
    const notificationsQuery = `
      SELECT id, type, content, is_read, reference_id, reference_type, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    // Execute the notifications query
    const notificationsResult = await pool.query(
      notificationsQuery,
      queryParams
    );

    // Return the notifications
    res.status(200).json({
      notifications: notificationsResult.rows,
      unread_count: unreadCount,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while getting notifications:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting notifications',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the mark notification as read controller
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the notification ID from the request parameters
    const notificationId = req.params.id;
    const userId = req.user?.id;

    // Check if the user is authenticated
    if (!userId) {
      res.status(401).json({
        success: false,
        message: '⚠️ Authentication required',
      });

      return;
    }

    // Check if the notification ID is valid
    const notificationCheck = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    // Check if the notification exists
    if (notificationCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ Notification not found',
      });

      return;
    }

    // Update the notification status to 'read'
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [
      notificationId,
    ]);

    // Return success message
    res.status(200).json({
      success: true,
      message: '✨ Notification marked as read',
    });
  } catch (error: any) {
    // Handle errors
    console.error(
      '⚠️ Error while marking notification as read:',
      error.message
    );

    res.status(500).json({
      success: false,
      message: '⚠️ Error while marking notification as read',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// Set up the mark all notifications as read controller
export const markAllNotificationsAsRead = async (
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

    // Update all notifications to 'read'
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    // Return success message
    res.status(200).json({
      success: true,
      message: '✨ All notifications marked as read',
    });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while marking all notifications as read:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while marking all notifications as read',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
