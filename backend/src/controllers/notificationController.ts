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

// 알림 목록 조회
export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { is_read, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 쿼리 조건 생성
    let whereClause = 'WHERE user_id = $1';
    const queryParams = [userId];

    if (is_read !== undefined) {
      whereClause += ` AND is_read = $${queryParams.length + 1}`;
      queryParams.push(Number(is_read === 'true'));
    }

    // 전체 알림 수 조회
    const countQuery = `
      SELECT COUNT(*) FROM notifications
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // 읽지 않은 알림 수 조회
    const unreadCountQuery = `
      SELECT COUNT(*) FROM notifications
      WHERE user_id = $1 AND is_read = false
    `;

    const unreadCountResult = await pool.query(unreadCountQuery, [userId]);
    const unreadCount = parseInt(unreadCountResult.rows[0].count);

    // 알림 목록 조회
    queryParams.push(Number(limit));
    queryParams.push(offset);

    const notificationsQuery = `
      SELECT id, type, content, is_read, reference_id, reference_type, created_at
      FROM notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const notificationsResult = await pool.query(
      notificationsQuery,
      queryParams
    );

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
  } catch (error) {
    console.error('알림 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '알림 목록 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 알림 읽음 처리
export const markNotificationAsRead = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const notificationId = req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: '인증이 필요합니다',
      });
      return;
    }

    // 알림 소유자인지 확인
    const notificationCheck = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, userId]
    );

    if (notificationCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '알림을 찾을 수 없습니다',
      });
      return;
    }

    // 읽음 처리
    await pool.query('UPDATE notifications SET is_read = true WHERE id = $1', [
      notificationId,
    ]);

    res.status(200).json({
      success: true,
      message: '알림이 읽음 처리되었습니다',
    });
  } catch (error) {
    console.error('알림 읽음 처리 에러:', error);
    res.status(500).json({
      success: false,
      message: '알림 읽음 처리 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

// 모든 알림 읽음 처리
export const markAllNotificationsAsRead = async (
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

    // 모든 알림 읽음 처리
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.status(200).json({
      success: true,
      message: '모든 알림이 읽음 처리되었습니다',
    });
  } catch (error) {
    console.error('모든 알림 읽음 처리 에러:', error);
    res.status(500).json({
      success: false,
      message: '모든 알림 읽음 처리 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
