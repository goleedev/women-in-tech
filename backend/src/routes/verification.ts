import express, { Request, Response, Router } from 'express';
import pool from '../config/db';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router: Router = express.Router();

// ✅ 이메일 전송 설정 (Gmail SMTP 사용)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // .env에서 이메일 계정 가져오기
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ 1. 이메일 인증 요청 (POST /api/verification/request)
router.post('/request', async (req: Request, res: Response): Promise<any> => {
  const { user_id, email } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 기존 인증 토큰 삭제 (이전 요청 무효화)
    await pool.query(`DELETE FROM verification_tokens WHERE user_id = $1`, [
      user_id,
    ]);

    // 새 토큰 생성
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1시간 후 만료

    await pool.query(
      `INSERT INTO verification_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user_id, token, expiresAt]
    );

    // 이메일 전송
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증 요청',
      text: `다음 링크를 클릭하여 이메일을 인증하세요: ${verificationLink}`,
    });

    return res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('🔥 Email Verification Error:', error);
    return res
      .status(500)
      .json({ error: 'Server error', details: (error as Error).message });
  }
});

// ✅ 2. 이메일 인증 확인 (GET /api/verification/confirm/:token)
router.get(
  '/confirm/:token',
  async (req: Request, res: Response): Promise<any> => {
    const { token } = req.params;

    try {
      const result = await pool.query(
        `SELECT * FROM verification_tokens WHERE token = $1 AND expires_at > NOW()`,
        [token]
      );

      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }

      const userId = result.rows[0].user_id;

      // 사용자의 이메일 인증 상태 업데이트
      await pool.query(`UPDATE users SET is_verified = TRUE WHERE id = $1`, [
        userId,
      ]);

      // 사용된 토큰 삭제
      await pool.query(`DELETE FROM verification_tokens WHERE token = $1`, [
        token,
      ]);

      return res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('🔥 Email Verification Error:', error);
      return res
        .status(500)
        .json({ error: 'Server error', details: (error as Error).message });
    }
  }
);

// ✅ 3. 인증 이메일 다시 보내기 (POST /api/verification/resend)
router.post('/resend', async (req: Request, res: Response): Promise<any> => {
  const { user_id, email } = req.body;

  if (!user_id || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // 기존 요청 API 로직 재사용
  try {
    // 기존 인증 토큰 삭제 (이전 요청 무효화)
    await pool.query(`DELETE FROM verification_tokens WHERE user_id = $1`, [
      user_id,
    ]);

    // 새 토큰 생성
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1시간 후 만료

    await pool.query(
      `INSERT INTO verification_tokens (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user_id, token, expiresAt]
    );

    // 이메일 전송
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: '이메일 인증 요청 (재전송)',
      text: `다음 링크를 클릭하여 이메일을 인증하세요: ${verificationLink}`,
    });

    return res.json({ message: 'Verification email resent' });
  } catch (error) {
    console.error('🔥 Email Verification Error:', error);
    return res
      .status(500)
      .json({ error: 'Server error', details: (error as Error).message });
  }
});

export default router;
