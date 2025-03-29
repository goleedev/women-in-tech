import { Request, Response, NextFunction } from 'express';
import pool from '../../database';
import { AuthRequest } from '../../types/auth.type';

// Set up the user profile controller
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request
    const userId = req.params.id;

    // Check if the user ID is valid
    const userResult = await pool.query(
      `SELECT id, name, expertise, profession, seniority_level, country, role, bio, profile_image_url
       FROM users WHERE id = $1`,
      [userId]
    );

    // Check if the user exists
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ User not found',
      });

      return;
    }

    // Check if the user exists
    const user = userResult.rows[0];

    // Get the user's tags
    const tagsResult = await pool.query(
      `SELECT t.name
       FROM tags t
       JOIN user_tags ut ON t.id = ut.tag_id
       WHERE ut.user_id = $1`,
      [userId]
    );

    // Set up the tags
    const tags = tagsResult.rows.map((tag) => tag.name);

    // Return the user profile
    res.status(200).json({
      ...user,
      tags,
    });
  } catch (error: any) {
    // Handle errors during user profile retrieval
    console.error('⚠️ Error while getting the profile:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting the profile',
    });
  }
};

// Set up the user profile update controller
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the user ID from the request
    const userId = req.params.id;

    // Check if the user ID is valid
    if (userId !== req.user?.id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '⚠️ You do not have permission to update this profile',
      });

      return;
    }

    // Get the profile data from the request body
    const { name, expertise, profession, seniority_level, country, bio } =
      req.body;

    // Update the user profile
    const updateResult = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           expertise = COALESCE($2, expertise),
           profession = COALESCE($3, profession),
           seniority_level = COALESCE($4, seniority_level),
           country = COALESCE($5, country),
           bio = COALESCE($6, bio)
       WHERE id = $7
       RETURNING id, name, expertise, profession, seniority_level, country, role, bio`,
      [name, expertise, profession, seniority_level, country, bio, userId]
    );

    // Check if the user exists
    if (updateResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ User not found',
      });

      return;
    }

    // Return the updated user profile
    res.status(200).json({
      success: true,
      message: '✨ Profile updated successfully',
      user: updateResult.rows[0],
    });
  } catch (error: any) {
    // Handle errors during user profile update
    console.error('⚠️ Error while updating the profile:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while updating the profile',
    });
  }
};

// Set up the user tags update controller
export const updateUserTags = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  // Connect to the database
  const client = await pool.connect();

  try {
    // Get the user ID from the request
    const userId = req.params.id;

    // Check if the user ID is valid
    if (userId !== req.user?.id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '⚠️ You do not have permission to update this profile',
      });

      return;
    }

    // Get the tags from the request body
    const { tags } = req.body;

    // Start a transaction
    await client.query('BEGIN');

    // Delete existing tags
    await client.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

    // Insert new tags
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // Check if the tag exists
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1',
          [tagName]
        );

        let tagId;

        // If the tag does not exist, create it
        if (tagResult.rows.length === 0) {
          const newTagResult = await client.query(
            'INSERT INTO tags (name, category) VALUES ($1, $2) RETURNING id',
            [tagName, 'expertise']
          );
          // Get the new tag ID
          tagId = newTagResult.rows[0].id;
        } else {
          // Get the existing tag ID
          tagId = tagResult.rows[0].id;
        }

        // Insert the user-tag relationship
        await client.query(
          'INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)',
          [userId, tagId]
        );
      }
    }

    // Commit the transaction
    await client.query('COMMIT');

    // Return the updated tags
    res.status(200).json({
      success: true,
      message: '✨ Tags updated successfully',
      tags,
    });
  } catch (error: any) {
    // Rollback the transaction in case of error
    await client.query('ROLLBACK');

    // Handle errors during tag update
    console.error('⚠️ Error while updating tags:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while updating tags',
    });
  } finally {
    // Release the database client
    client.release();
  }
};
