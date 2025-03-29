import { Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the user information retrieval controller
export const getMyProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Check if the user is authenticated
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '⚠️ Not authorized user',
      });

      return;
    }

    // Retrieve the user information from the database
    const result = await pool.query(
      `SELECT id, email, name, expertise, profession, seniority_level, country, role, bio, 
      profile_image_url, is_verified, created_at
      FROM users WHERE id = $1`,
      [req.user.id]
    );

    // Check if the user exists
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ User not found',
      });

      return;
    }

    // Return the user information
    res.status(200).json(result.rows[0]);
  } catch (error: any) {
    // Handle errors during user information retrieval
    console.error('⚠️ Error retrieving user information:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error retrieving user information',
    });
  }
};
