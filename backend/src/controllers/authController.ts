import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { generateToken } from '../utils/helper';

// Request 타입 확장
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

// 회원가입
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
    // 이메일 중복 확인
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    if (userCheck.rows.length > 0) {
      res.status(400).json({
        success: false,
        message: '이미 사용 중인 이메일입니다',
      });
      return;
    }

    // 비밀번호 해싱
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 사용자 생성
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
        secondary_role || null, // secondary_role이 없으면 null
        bio,
      ]
    );

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: newUser.rows[0],
    });

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error('회원가입 에러:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 처리 중 오류가 발생했습니다',
    });
  }
};

// 로그인
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 사용자 조회
    const result = await pool.query(
      'SELECT id, email, name, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
      return;
    }

    const user = result.rows[0];

    // 비밀번호 확인
    const isPasswordMatch = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordMatch) {
      res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 올바르지 않습니다',
      });
      return;
    }

    // 최근 로그인 시간 업데이트
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [
      user.id,
    ]);

    // 비밀번호 해시 제거
    const { password_hash, ...userWithoutPassword } = user;

    // JWT 토큰 생성
    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    res.status(500).json({
      success: false,
      message: '로그인 처리 중 오류가 발생했습니다',
    });
  }
};

// 내 정보 조회
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: '인증되지 않은 사용자입니다',
      });
      return;
    }

    const result = await pool.query(
      `SELECT id, email, name, expertise, profession, seniority_level, country, role, bio, 
      profile_image_url, is_verified, created_at FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
      return;
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('내 정보 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다',
    });
  }
};

// 로그아웃
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: '로그아웃되었습니다',
  });
};
