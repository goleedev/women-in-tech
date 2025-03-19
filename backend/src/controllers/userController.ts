import { Request, Response, NextFunction } from 'express';
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

// 사용자 프로필 조회
export const getUserProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // 사용자 기본 정보 조회
    const userResult = await pool.query(
      `SELECT id, name, expertise, profession, seniority_level, country, role, bio, profile_image_url
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
      return;
    }

    const user = userResult.rows[0];

    // 사용자 태그 조회
    const tagsResult = await pool.query(
      `SELECT t.name
       FROM tags t
       JOIN user_tags ut ON t.id = ut.tag_id
       WHERE ut.user_id = $1`,
      [userId]
    );

    const tags = tagsResult.rows.map((tag) => tag.name);

    res.status(200).json({
      ...user,
      tags,
    });
  } catch (error) {
    console.error('사용자 프로필 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '사용자 프로필 조회 중 오류가 발생했습니다',
    });
  }
};

// 사용자 프로필 업데이트
export const updateUserProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.params.id;

    // 자신의 프로필만 수정 가능
    if (userId !== req.user?.id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '다른 사용자의 프로필을 수정할 권한이 없습니다',
      });
      return;
    }

    const { name, expertise, profession, seniority_level, country, bio } =
      req.body;

    // 프로필 업데이트
    const updateResult = await pool.query(
      `UPDATE users
       SET name = COALESCE($1, name),
           expertise = COALESCE($2, expertise),
           profession = COALESCE($3, profession),
           seniority_level = COALESCE($4, seniority_level),
           country = COALESCE($5, country),
           bio = COALESCE($6, bio)
       WHERE id = $7
       RETURNING id, name, expertise, profession, seniority_level, country, role, bio`,
      [name, expertise, profession, seniority_level, country, bio, userId]
    );

    if (updateResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: '프로필이 업데이트되었습니다',
      user: updateResult.rows[0],
    });
  } catch (error) {
    console.error('프로필 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '프로필 업데이트 중 오류가 발생했습니다',
    });
  }
};

// 사용자 태그 업데이트
export const updateUserTags = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const client = await pool.connect();

  try {
    const userId = req.params.id;

    // 자신의 태그만 수정 가능
    if (userId !== req.user?.id.toString() && req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: '다른 사용자의 태그를 수정할 권한이 없습니다',
      });
      return;
    }

    const { tags } = req.body;

    // 트랜잭션 시작
    await client.query('BEGIN');

    // 기존 태그 삭제
    await client.query('DELETE FROM user_tags WHERE user_id = $1', [userId]);

    // 새 태그 추가
    if (tags && tags.length > 0) {
      for (const tagName of tags) {
        // 태그가 존재하는지 확인
        let tagResult = await client.query(
          'SELECT id FROM tags WHERE name = $1',
          [tagName]
        );

        let tagId;

        // 태그가 존재하지 않으면 생성
        if (tagResult.rows.length === 0) {
          const newTagResult = await client.query(
            'INSERT INTO tags (name, category) VALUES ($1, $2) RETURNING id',
            [tagName, 'expertise'] // 기본 카테고리 설정
          );
          tagId = newTagResult.rows[0].id;
        } else {
          tagId = tagResult.rows[0].id;
        }

        // 사용자-태그 연결
        await client.query(
          'INSERT INTO user_tags (user_id, tag_id) VALUES ($1, $2)',
          [userId, tagId]
        );
      }
    }

    // 트랜잭션 커밋
    await client.query('COMMIT');

    res.status(200).json({
      success: true,
      message: '태그가 업데이트되었습니다',
      tags,
    });
  } catch (error) {
    // 트랜잭션 롤백
    await client.query('ROLLBACK');

    console.error('태그 업데이트 에러:', error);
    res.status(500).json({
      success: false,
      message: '태그 업데이트 중 오류가 발생했습니다',
    });
  } finally {
    client.release();
  }
};
