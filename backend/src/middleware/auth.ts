import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import pool from '../database';

import { AuthRequest } from '../types/auth.type';

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Check if token is in the request headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Check if token is in the cookies
  if (!token) {
    res.status(401).json({
      success: false,
      message: '⚠️ Not authorized to access this route',
    });

    return;
  }

  try {
    // Check if token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

    // Check if user exists in the database
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    // Check if user exists
    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '⚠️ No user found',
      });

      return;
    }

    // Attach user to request object
    req.user = result.rows[0];

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: '⚠️ Failed to authenticate token',
    });
  }
};

// Middleware to check if user has the required role
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '⚠️ Not authorized to access this route',
      });

      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '⚠️ Not authorized to access this route',
      });

      return;
    }

    next();
  };
};
