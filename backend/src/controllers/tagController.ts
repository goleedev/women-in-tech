import { Request, Response } from 'express';
import pool from '../database';

// 전체 태그 목록 조회
export const getAllTags = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.query;

    let query = 'SELECT id, name, category FROM tags';
    const queryParams: any[] = [];

    if (category) {
      query += ' WHERE category = $1';
      queryParams.push(category);
    }

    query += ' ORDER BY name ASC';

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      tags: result.rows,
    });
  } catch (error) {
    console.error('태그 목록 조회 에러:', error);
    res.status(500).json({
      success: false,
      message: '태그 목록 조회 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
