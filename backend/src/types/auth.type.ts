import { Request } from 'express';

// Set up the AuthRequest interface to extend the Request interface
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}
