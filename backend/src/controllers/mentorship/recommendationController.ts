import { Response } from 'express';

import pool from '../../database';
import { findMentorForMentee } from '../../utils/mentorship.utils';

import { AuthRequest } from '../../types/auth.type';

// Set up the recommended mentors controller
export const getRecommendedMentors = async (
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

    // Check if the user is a mentee
    const userCheck = await pool.query(
      'SELECT role, secondary_role FROM users WHERE id = $1',
      [userId]
    );

    // Check if the user exists and is a mentee
    if (
      userCheck.rows.length === 0 ||
      (userCheck.rows[0].role !== 'mentee' &&
        userCheck.rows[0].secondary_role !== 'mentee')
    ) {
      res.status(400).json({
        success: false,
        message: '⚠️ You are not a mentee',
      });

      return;
    }

    // Fetch recommended mentors for the mentee
    const recommendedMentors = await findMentorForMentee(userId);

    // Check if there are recommended mentors
    const topMentors = recommendedMentors.slice(0, 5);

    // Check if there are no recommended mentors
    res.status(200).json({
      recommended_mentors: topMentors,
    });
  } catch (error: any) {
    // Handle errors during recommended mentors retrieval
    console.error('⚠️ Error while getting recommended mentors:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting recommended mentors',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
