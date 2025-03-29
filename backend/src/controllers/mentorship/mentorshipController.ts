import { Response } from 'express';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the mentorship controller
export const getUsers = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the query parameters for users
    const {
      role,
      mode,
      expertise,
      seniority_level,
      country,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Calculate the offset for pagination
    const offset = (Number(page) - 1) * Number(limit);
    // Get the current user ID from the request
    const currentUserId = req.user?.id;

    // Initialize query parameters and conditions
    let queryParams: any[] = [];
    let queryConditions: string[] = [];
    let queryIndex = 1;

    // Filter by role
    if (role) {
      // Check if the role or the secondary role is a valid string
      queryConditions.push(
        `(role = $${queryIndex} OR secondary_role = $${queryIndex})`
      );

      // Add the role to the query parameters
      queryParams.push(role);
      // Increment the query index
      queryIndex++;
    }

    // Filter by mode (mentor/mentee)
    if (mode) {
      // Check if the mode is either 'mentor' or 'mentee'
      if (mode === 'mentor') {
        // Add the condition for mentee
        queryConditions.push(`(role = 'mentee' OR secondary_role = 'mentee')`);
      } else if (mode === 'mentee') {
        // Add the condition for mentor
        queryConditions.push(`(role = 'mentor' OR secondary_role = 'mentor')`);
      }
    }

    // Filter by expertise
    if (expertise) {
      // Check if the expertise is a valid string
      queryConditions.push(`expertise ILIKE $${queryIndex}`);
      queryParams.push(`%${expertise}%`);
      queryIndex++;
    }

    // Filter by seniority level
    if (seniority_level) {
      // Check if the seniority level is a valid string
      queryConditions.push(`seniority_level = $${queryIndex}`);
      queryParams.push(seniority_level);
      queryIndex++;
    }

    // Filter by country
    if (country) {
      // Check if the country is a valid string
      queryConditions.push(`country ILIKE $${queryIndex}`);
      queryParams.push(`%${country}%`);
      queryIndex++;
    }

    // Filter by search term
    if (search) {
      // Check if the search term is a valid string
      queryConditions.push(
        `(name ILIKE $${queryIndex} OR expertise ILIKE $${queryIndex} OR profession ILIKE $${queryIndex})`
      );
      queryParams.push(`%${search}%`);
      queryIndex++;
    }

    // Filter out the current user
    if (currentUserId) {
      // Check if the current user ID is a valid number
      queryConditions.push(`id != $${queryIndex}`);
      queryParams.push(currentUserId);
      queryIndex++;
    }

    // Construct the WHERE clause
    const whereClause =
      queryConditions.length > 0
        ? `WHERE ${queryConditions.join(' AND ')}`
        : '';

    // Count total users
    const countQuery = `
      SELECT COUNT(*) FROM users
      ${whereClause}
    `;

    // Count the total number of users
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Query to get users
    const usersQuery = `
      SELECT id, name, expertise, profession, seniority_level, country, role, secondary_role, bio, profile_image_url
      FROM users
      ${whereClause}
      ORDER BY name ASC
      LIMIT $${queryIndex} OFFSET $${queryIndex + 1}
    `;

    // Add the limit and offset to the query parameters
    queryParams.push(Number(limit));
    queryParams.push(offset);

    // Execute the query to get users
    const usersResult = await pool.query(usersQuery, queryParams);

    // Check if there are users
    let users = usersResult.rows;

    // If the user is authenticated, fetch additional data
    if (currentUserId) {
      // Fetch the current user's details for similarity calculation
      const currentUserResult = await pool.query(
        `SELECT expertise, profession, seniority_level, country FROM users WHERE id = $1`,
        [currentUserId]
      );

      // Check if the current user exists
      if (currentUserResult.rows.length > 0) {
        const currentUser = currentUserResult.rows[0];

        // Fetch tags for each user
        for (let i = 0; i < users.length; i++) {
          // Fetch tags for the user
          const tagsResult = await pool.query(
            `SELECT t.name
             FROM tags t
             JOIN user_tags ut ON t.id = ut.tag_id
             WHERE ut.user_id = $1`,
            [users[i].id]
          );

          // Map the tags to the user
          users[i].tags = tagsResult.rows.map((tag) => tag.name);

          // Calculate similarity score
          let similarityScore = 0;

          // Calculate similarity based on expertise, profession, and country
          if (users[i].expertise === currentUser.expertise)
            similarityScore += 3;
          if (users[i].profession === currentUser.profession)
            similarityScore += 2;
          if (users[i].country === currentUser.country) similarityScore += 2;

          // Calculate based on roles
          if (req.user?.role === 'mentee' && users[i].role === 'mentor') {
            if (users[i].seniority_level === 'Senior') similarityScore += 2;
            else if (users[i].seniority_level === 'Mid-level')
              similarityScore += 1.5;
          }

          // Similarity score
          users[i].similarity_score = similarityScore;

          // Check if the user is connected
          const connectionResult = await pool.query(
            `SELECT status FROM mentorship_connections 
             WHERE (mentor_id = $1 AND mentee_id = $2) OR (mentor_id = $2 AND mentee_id = $1)`,
            [users[i].id, currentUserId]
          );

          // Connection status
          users[i].is_connected =
            connectionResult.rows.length > 0 &&
            connectionResult.rows[0].status === 'accepted';

          // Set connection status
          if (connectionResult.rows.length > 0) {
            users[i].connection_status = connectionResult.rows[0].status;
          }
        }

        // Sort users by similarity score
        users.sort((a, b) => b.similarity_score - a.similarity_score);
      }
    } else {
      // If the user is not authenticated, fetch tags only
      for (let i = 0; i < users.length; i++) {
        const tagsResult = await pool.query(
          `SELECT t.name
           FROM tags t
           JOIN user_tags ut ON t.id = ut.tag_id
           WHERE ut.user_id = $1`,
          [users[i].id]
        );

        // Map the tags to the user
        users[i].tags = tagsResult.rows.map((tag) => tag.name);
        // Set default values
        users[i].similarity_score = 0;
        // Set default connection status
        users[i].is_connected = false;
      }
    }

    // Return the users and pagination data
    res.status(200).json({
      users,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    // Handle errors during user search
    console.error('⚠️ Error while searching mentors/mentees:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while searching mentors/mentees',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
