import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import pool from '../../database';

// Set up the user registration controller
export const register = async (req: Request, res: Response): Promise<void> => {
  const {
    email,
    name,
    password,
    expertise,
    profession,
    seniority_level,
    country,
    role,
    secondary_role,
    bio,
  } = req.body;

  try {
    // Check if the email is already in use
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    // Check if the email is already registered
    if (userCheck.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: '⚠️ Email is already registered',
      });

      return;
    }

    // Check if the password is strong enough
    const salt = await bcrypt.genSalt(10);
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = await pool.query(
      `INSERT INTO users 
      (email, name, password_hash, expertise, profession, seniority_level, country, role, secondary_role, bio) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
      RETURNING id, email, name, role, secondary_role`,
      [
        email,
        name,
        hashedPassword,
        expertise,
        profession,
        seniority_level,
        country,
        role,
        secondary_role || null,
        bio,
      ]
    );

    // Check if the user was created successfully
    res.status(201).json({
      success: true,
      message: '✨ Successfully registered',
      user: newUser.rows[0],
    });
  } catch (error: any) {
    // Handle errors during registration
    console.error('⚠️ Error during registration:', error.message);

    res.status(500).json({
      success: false,
      message: '⚠️ Error during registration',
    });
  }
};
