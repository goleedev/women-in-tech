import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

// Request 타입 확장
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  // Bearer 토큰 확인
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({
      success: false,
      message: '이 리소스에 접근하려면 로그인이 필요합니다',
    });
    return;
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: number;
    };

    // 사용자 정보 조회
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '해당 토큰의 사용자를 찾을 수 없습니다',
      });
      return;
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '인증에 실패했습니다',
    });
  }
};

// 특정 역할 사용자만 접근 가능하도록 하는 미들웨어
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '이 리소스에 접근하려면 로그인이 필요합니다',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: '이 리소스에 접근할 권한이 없습니다',
      });
      return;
    }

    next();
  };
};
