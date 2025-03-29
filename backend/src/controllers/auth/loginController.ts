import { Request, Response } from 'express';
import bcrypt from 'bcrypt';

import pool from '../../database';
import { generateToken } from '../../utils/auth.utils';

// Set up the user login controller
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // Check if the email and password are provided
    const result = await pool.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    // Check if the user exists
    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '⚠️ Invalid email or password',
      });

      return;
    }

    // Get the user from the database
    const user = result.rows[0];

    // Check if the password is correct
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    // Return an error if the email or password is incorrect
    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        message: '⚠️ Invalid email or password',
      });

      return;
    }

    // Update the last login time
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [
      user.id,
    ]);

    // Remove the password_hash from the user object
    const { password_hash, ...userWithoutPassword } = user;

    // Generate a JWT token
    const token = generateToken(user.id);

    // Return the token and user information
    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error: any) {
    console.error('⚠️ Error logging in:', error.message);

    // Handle errors during login
    res.status(500).json({
      success: false,
      message: '⚠️ Error logging in',
    });
  }
};

// Set up the user logout controller
export const logout = (req: Request, res: Response): any => {
  // Clear the JWT token from the cookies
  res.status(200).json({
    success: true,
    message: '✨ Successfully logged out',
  });
};
