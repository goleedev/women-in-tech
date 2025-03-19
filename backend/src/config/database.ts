// src/config/database.ts
import { Pool } from 'pg';
import { config } from 'dotenv';

config();

console.log(
  'DATABASE_URL:',
  process.env.DATABASE_URL ? 'exists (masked for security)' : 'missing'
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // SSL 인증서 유효성 검사를 건너뛰도록 설정
  },
});

// 데이터베이스 연결 테스트
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Error acquiring client', err.stack);
  }
  console.log('Database connected successfully');
  release();
});

export default pool;
