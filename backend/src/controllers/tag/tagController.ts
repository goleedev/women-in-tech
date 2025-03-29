import { Request, Response } from 'express';

import pool from '../../database';

// Set up the tag controller
export const getAllTags = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the query parameters for tags
    const { category } = req.query;

    // Initialize the query and parameters
    let query = 'SELECT id, name, category FROM tags';
    const queryParams: any[] = [];

    // Check if a category is provided
    if (category) {
      query += ' WHERE category = $1';
      queryParams.push(category);
    }

    // Add ordering to the query
    query += ' ORDER BY name ASC';

    // Query the database
    const result = await pool.query(query, queryParams);

    // Return the tags
    res.status(200).json({
      tags: result.rows,
    });
  } catch (error: any) {
    // Handle errors during tag retrieval
    console.error('⚠️ Error while getting tags:', error.message);
    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting tags',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
