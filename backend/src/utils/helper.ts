import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// JWT 토큰 생성
export const generateToken = (id: number): string => {
  return jwt.sign({ id }, JWT_SECRET as jwt.Secret, {
    expiresIn: JWT_EXPIRE as jwt.SignOptions['expiresIn'],
  });
};
