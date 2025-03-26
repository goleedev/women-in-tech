import jwt from 'jsonwebtoken';

// Setup JWT keys
const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// Create a function to generate auth token
export const generateToken = (id: number): string => {
  return jwt.sign({ id: id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE as jwt.SignOptions['expiresIn'],
  });
};
