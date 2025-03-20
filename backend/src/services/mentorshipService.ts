import pool from '../config/database';

// 멘티를 위한 멘토 찾기
export const findMentorForMentee = async (menteeId: number) => {
  try {
    // 멘티 정보 조회
    const menteeResult = await pool.query(
      `SELECT id, expertise, profession, seniority_level, country 
       FROM users 
       WHERE id = $1 AND role = 'mentee'`,
      [menteeId]
    );

    if (menteeResult.rows.length === 0) {
      throw new Error('Mentee not found');
    }

    const mentee = menteeResult.rows[0];

    // 멘토 목록 조회 및 유사도 계산
    const mentorsResult = await pool.query(
      `SELECT id, name, expertise, profession, seniority_level, country, 
              (SELECT MAX(last_matched) FROM mentorship_connections WHERE mentor_id = users.id) as last_matched
       FROM users 
       WHERE role = 'mentor'
       AND id NOT IN (
         SELECT mentor_id FROM mentorship_connections WHERE mentee_id = $1
       )`,
      [menteeId]
    );

    // 유사도 계산 및 정렬
    const mentorsWithScores = mentorsResult.rows.map((mentor) => {
      let score = 0;

      // 전문 분야가 일치하면 가중치 3
      if (mentor.expertise === mentee.expertise) {
        score += 3;
      }

      // 직업군이 일치하면 가중치 2
      if (mentor.profession === mentee.profession) {
        score += 2;
      }

      // 경력 수준에 따른 가중치
      if (mentor.seniority_level === 'Senior') {
        score += 1.5; // 시니어 멘토 선호
      } else if (mentor.seniority_level === 'Mid-level') {
        score += 1;
      }

      // 국가가 일치하면 가중치 2
      if (mentor.country === mentee.country) {
        score += 2;
      } else {
        score += 1; // 다른 국가여도 일부 점수 부여
      }

      return {
        ...mentor,
        similarity_score: score,
      };
    });

    // 유사도 점수로 정렬하고, 같은 점수면 최근 매칭이 적은 멘토 우선
    mentorsWithScores.sort((a, b) => {
      if (b.similarity_score !== a.similarity_score) {
        return b.similarity_score - a.similarity_score;
      }

      const dateA = a.last_matched ? new Date(a.last_matched) : new Date(0);
      const dateB = b.last_matched ? new Date(b.last_matched) : new Date(0);

      return dateA.getTime() - dateB.getTime();
    });

    return mentorsWithScores;
  } catch (error) {
    console.error('멘토 매칭 에러:', error);
    throw error;
  }
};
