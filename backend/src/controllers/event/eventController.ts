import { Request, RequestHandler, Response } from 'express';
import jwt from 'jsonwebtoken';

import pool from '../../database';

import { AuthRequest } from '../../types/auth.type';

// Set up the event controller
export const getEvents = async (req: Request, res: Response) => {
  try {
    // Set up data from the request
    const { location, date, topic, search, page = 1, limit = 10 } = req.query;
    // Set up the default values
    const offset = (Number(page) - 1) * Number(limit);

    // Set up the query parameters
    let queryParams: any[] = [];
    // Set up the query conditions
    let queryConditions: string[] = [];
    // Set up the query index
    let queryIndex = 1;

    // Set up the query based on the location
    if (location) {
      queryConditions.push(`location ILIKE $${queryIndex}`);
      queryParams.push(`%${location}%`);
      queryIndex++;
    }

    // Set up the query based on the date
    if (date) {
      queryConditions.push(`DATE(date) = $${queryIndex}`);
      queryParams.push(date);
      queryIndex++;
    }

    // Set up the query based on the topic
    if (topic) {
      queryConditions.push(`topic ILIKE $${queryIndex}`);
      queryParams.push(`%${topic}%`);
      queryIndex++;
    }

    // Set up the query based on the search
    if (search) {
      queryConditions.push(
        `(title ILIKE $${queryIndex} OR description ILIKE $${queryIndex})`
      );
      queryParams.push(`%${search}%`);
      queryIndex++;
    }

    // Set up the where clause
    const whereClause =
      queryConditions.length > 0
        ? `WHERE ${queryConditions.join(' AND ')}`
        : '';

    // Set up the count query
    const countQuery = `
      SELECT COUNT(*) FROM events
      ${whereClause}
    `;

    // Get the total number of events
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Set up the events query
    queryParams.push(Number(limit));
    queryParams.push(offset);

    // Query to get the events
    const eventsQuery = `
      SELECT e.id, e.title, e.description, e.date, e.end_date, e.location, e.topic,
             e.max_attendees, e.image_url, e.is_online, e.online_link, e.status,
             u.id as organizer_id, u.name as organizer_name,
             (SELECT COUNT(*) FROM event_attendees WHERE event_id = e.id) as current_attendees
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      ${whereClause}
      ORDER BY e.date ASC
      LIMIT $${queryIndex} OFFSET $${queryIndex + 1}
    `;

    // Get the events
    const eventsResult = await pool.query(eventsQuery, queryParams);

    // Get the user ID from the request headers
    const authHeader = req.headers.authorization;
    let userId = null;

    // Check if the user is authenticated
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      // Get the user ID from the token
      userId = decoded.id;
    }

    // Check if the user is authenticated
    let events = eventsResult.rows;

    if (userId) {
      // Set up the query to get the liked events and tags
      for (let i = 0; i < events.length; i++) {
        // Get the tags for each event
        const tagsResult = await pool.query(
          `SELECT t.name
           FROM tags t
           JOIN event_tags et ON t.id = et.tag_id
           WHERE et.event_id = $1`,
          [events[i].id]
        );

        // Set the tags for each event
        events[i].tags = tagsResult.rows.map((tag) => tag.name);

        // Get the like status for each event
        const likeResult = await pool.query(
          `SELECT id FROM event_likes
           WHERE event_id = $1 AND user_id = $2`,
          [events[i].id, userId]
        );

        // Set the like status for each event
        events[i].is_liked = likeResult.rows.length > 0;
      }
    } else {
      // If the user is not authenticated, set the default values
      for (let i = 0; i < events.length; i++) {
        const tagsResult = await pool.query(
          `SELECT t.name
           FROM tags t
           JOIN event_tags et ON t.id = et.tag_id
           WHERE et.event_id = $1`,
          [events[i].id]
        );

        // Set the tags for each event
        events[i].tags = tagsResult.rows.map((tag) => tag.name);
        // Set the default values for each event
        events[i].is_liked = false;
      }
    }

    // Format the events
    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      end_date: event.end_date,
      location: event.location,
      topic: event.topic,
      organizer: {
        id: event.organizer_id,
        name: event.organizer_name,
      },
      max_attendees: event.max_attendees,
      current_attendees: event.current_attendees,
      image_url: event.image_url,
      is_online: event.is_online,
      online_link: event.online_link,
      status: event.status,
      is_liked: event.is_liked,
      tags: event.tags,
    }));

    // Return the events
    res.status(200).json({
      events: formattedEvents,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while loading events:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while loading events',
    });
  }
};

// Set up the event creation controller
export const createEvent = async (req: AuthRequest, res: Response) => {
  // Set up the database connection
  const client = await pool.connect();

  try {
    const {
      title,
      description,
      date,
      end_date,
      location,
      topic,
      max_attendees,
      is_online,
      online_link,
      tags,
    } = req.body;

    // Query to start the transaction
    await client.query('BEGIN');

    // Query to insert the event
    const eventResult = await client.query(
      `INSERT INTO events
       (title, description, date, end_date, location, topic, organizer_id, max_attendees, is_online, online_link)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, date`,
      [
        title,
        description,
        date,
        end_date,
        location,
        topic,
        req.user?.id,
        max_attendees,
        is_online,
        online_link,
      ]
    );

    // Get the event ID
    const eventId = eventResult.rows[0].id;

    // Check if tags are provided
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1',
          [tagName]
        );

        let tagId;

        // Check if the tag exists
        if (tagResult.rows.length === 0) {
          // Create a new tag if it doesn't exist
          const newTagResult = await client.query(
            'INSERT INTO tags (name, category) VALUES ($1, $2) RETURNING id',
            [tagName, 'topic']
          );

          // Get the new tag ID
          tagId = newTagResult.rows[0].id;
        } else {
          // Get the existing tag ID
          tagId = tagResult.rows[0].id;
        }

        // Insert the event-tag relationship
        await client.query(
          'INSERT INTO event_tags (event_id, tag_id) VALUES ($1, $2)',
          [eventId, tagId]
        );
      }
    }

    // Commit the transaction
    await client.query('COMMIT');

    // Return the response
    res.status(201).json({
      success: true,
      message: '✨ Successfully created the event',
      event: eventResult.rows[0],
    });
  } catch (error: any) {
    // Rollback the transaction in case of an error
    await client.query('ROLLBACK');

    // Handle errors
    console.error('⚠️ Error while creating an event:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while creating an event',
    });
  } finally {
    // Release the database connection
    client.release();
  }
};

// Set up the event update controller
export const updateEvent: RequestHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    // Get the event ID from the request parameters
    const eventId = req.params.id;

    // Get the event from the database
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [
      eventId,
    ]);

    // Check if the event exists
    if (eventResult.rows.length === 0) {
      res.status(404).json({ success: false, message: '⚠️ Events not found' });
      return;
    }

    // Check if the user is authorized to update the event
    if (
      eventResult.rows[0].organizer_id !== req.user?.id &&
      req.user?.role !== 'admin'
    ) {
      res.status(403).json({
        success: false,
        message: '⚠️ No permission to update the event',
      });
      return;
    }

    const {
      title,
      description,
      date,
      end_date,
      location,
      topic,
      max_attendees,
    } = req.body;

    // Query to update the event
    await pool.query(
      `UPDATE events SET title = COALESCE($1, title), description = COALESCE($2, description),
       date = COALESCE($3, date), end_date = COALESCE($4, end_date), location = COALESCE($5, location),
       topic = COALESCE($6, topic), max_attendees = COALESCE($7, max_attendees)
       WHERE id = $8`,
      [
        title,
        description,
        date,
        end_date,
        location,
        topic,
        max_attendees,
        eventId,
      ]
    );

    // Retrieve the updated event
    res
      .status(200)
      .json({ success: true, message: '✨ Successfully updated the event' });
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while updating the event:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while updating the event',
    });
  }
};

// Set up the event detail controller
export const getEventById: RequestHandler = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Get the event ID from the request parameters
    const eventId = req.params.id;
    const authHeader = req.headers.authorization;

    // Set up the user ID
    let userId = null;

    // Retrieve the user ID from the token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET as string);

      // Get the user ID from the token
      userId = decoded.id;
    }

    // Query to get the event details
    const eventResult = await pool.query(
      `SELECT e.id, e.title, e.description, e.date, e.end_date, e.location, e.topic,
              e.max_attendees, e.image_url, e.is_online, e.online_link, e.status,
              u.id as organizer_id, u.name as organizer_name, u.email as organizer_email
       FROM events e
       JOIN users u ON e.organizer_id = u.id
       WHERE e.id = $1`,
      [eventId]
    );

    // Check if the event exists
    if (eventResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '⚠️ Event not found',
      });

      return;
    }

    // Get the event details
    const event = eventResult.rows[0];

    // Check the like status
    if (userId) {
      const likeResult = await pool.query(
        `SELECT id FROM event_likes WHERE event_id = $1 AND user_id = $2`,
        [eventId, userId]
      );

      // Set the like status
      event.is_liked = likeResult.rows.length > 0;
    } else {
      // Set the default value for the like status
      event.is_liked = false;
    }

    // Check the attendee count
    const attendeesCountResult = await pool.query(
      `SELECT COUNT(*) FROM event_attendees WHERE event_id = $1`,
      [eventId]
    );

    // Set the current attendees count
    event.current_attendees = parseInt(attendeesCountResult.rows[0].count);

    // Get the tags for the event
    const tagsResult = await pool.query(
      `SELECT t.name
       FROM tags t
       JOIN event_tags et ON t.id = et.tag_id
       WHERE et.event_id = $1`,
      [eventId]
    );

    // Set the tags for the event
    event.tags = tagsResult.rows.map((tag) => tag.name);

    // Get the attendees for the event
    const attendeesResult = await pool.query(
      `SELECT u.id, u.name
       FROM users u
       JOIN event_attendees ea ON u.id = ea.user_id
       WHERE ea.event_id = $1`,
      [eventId]
    );

    // Set the attendees for the event
    event.attendees = attendeesResult.rows;

    // Return the event details
    res.status(200).json(event);
  } catch (error: any) {
    // Handle errors
    console.error('⚠️ Error while getting event details:', error);

    res.status(500).json({
      success: false,
      message: '⚠️ Error while getting event details',
    });
  }
};
