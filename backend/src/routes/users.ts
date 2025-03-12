import express, { Request, Response, Router } from 'express';
import pool from '../config/db';

const router: Router = express.Router();

// ✅ 모든 유저 조회 (GET /api/users)
router.get('/', async (req: Request, res: Response): Promise<any> => {
  try {
    const result = await pool.query('SELECT * FROM users');
    return res.json(result.rows);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 특정 유저 조회 (GET /api/users/:id)
router.get('/:id', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [
      userId,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 새 유저 추가 (POST /api/users)
router.post('/', async (req: Request, res: Response): Promise<any> => {
  const {
    name,
    email,
    password_hash,
    country,
    city,
    job_title,
    tech_stack,
    years_of_experience,
    mentoring_topics,
    available_times,
    calcom_link, // ✅ 추가된 필드
  } = req.body;

  if (!name || !email || !password_hash || !job_title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users 
        (name, email, password_hash, country, city, job_title, tech_stack, years_of_experience, mentoring_topics, available_times, calcom_link) 
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
      RETURNING *`,
      [
        name,
        email,
        password_hash,
        country,
        city,
        job_title,
        tech_stack,
        years_of_experience,
        mentoring_topics,
        available_times,
        calcom_link,
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 유저 정보 수정 (PUT /api/users/:id)
router.put('/:id', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.id;
  const {
    name,
    email,
    password_hash,
    country,
    city,
    job_title,
    tech_stack,
    years_of_experience,
    mentoring_topics,
    available_times,
    calcom_link, // ✅ 추가된 필드
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users SET 
        name = $1, email = $2, password_hash = $3, country = $4, city = $5, job_title = $6, 
        tech_stack = $7, years_of_experience = $8, mentoring_topics = $9, available_times = $10, calcom_link = $11
      WHERE id = $12 RETURNING *`,
      [
        name,
        email,
        password_hash,
        country,
        city,
        job_title,
        tech_stack,
        years_of_experience,
        mentoring_topics,
        available_times,
        calcom_link,
        userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

// ✅ 유저 삭제 (DELETE /api/users/:id)
router.delete('/:id', async (req: Request, res: Response): Promise<any> => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({ message: 'User deleted', deletedUser: result.rows[0] });
  } catch (error) {
    console.error('🔥 Database Error:', error);
    return res
      .status(500)
      .json({ error: 'Database error', details: (error as Error).message });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    return res.json({ message: 'Login successful', user });
  } catch (error) {
    console.error('🔥 Login Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;
