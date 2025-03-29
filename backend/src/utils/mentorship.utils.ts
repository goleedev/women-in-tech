import pool from '../database';

// Create a function to find a mentor for a mentee
export const findMentorForMentee = async (menteeId: number) => {
  try {
    // Find mentee information
    const menteeResult = await pool.query(
      `SELECT id, expertise, profession, seniority_level, country 
       FROM users 
       WHERE id = $1 AND role = 'mentee'`,
      [menteeId]
    );

    // Check if mentee exists
    if (menteeResult.rows.length === 0) {
      throw new Error('Mentee not found');
    }

    // Get mentee information
    const mentee = menteeResult.rows[0];

    // Find mentors who are not requested to mentee
    const notRequestedMentors = await pool.query(
      `SELECT id, name, expertise, profession, seniority_level, country, (SELECT MAX(last_matched) FROM mentorship_connections WHERE mentor_id = users.id) as last_matched
       FROM users 
       WHERE role = 'mentor'
       AND id NOT IN ( SELECT mentor_id FROM mentorship_connections WHERE mentee_id = $1)`,
      [menteeId]
    );

    // Check if there are mentors available
    const mentorsWithScores = notRequestedMentors.rows.map((mentor) => {
      let score = 0;

      // Add weights of three when expertise matches
      if (mentor.expertise === mentee.expertise) score += 3;

      // Add weights of two when profession matches
      if (mentor.profession === mentee.profession) score += 2;

      // Add weights of 1.5 when seniority level matches (in favor of mentor)
      if (mentor.seniority_level === 'Senior') {
        score += 1.5;
        // Add weights of 1 when seniority level is mid-level
      } else if (mentor.seniority_level === 'Mid-level') {
        score += 1;
      }

      // Add weights of 2 when country matches, or 1 if different
      if (mentor.country === mentee.country) {
        score += 2;
      } else {
        score += 1;
      }

      return {
        ...mentor,
        similarity_score: score,
      };
    });

    // Sort mentors by similarity score in descending order
    mentorsWithScores.sort((a, b) => {
      if (b.similarity_score !== a.similarity_score)
        return b.similarity_score - a.similarity_score;

      // If similarity scores are equal, sort by last matched date
      const dateA = a.last_matched ? new Date(a.last_matched) : new Date(0);
      // If last matched date is not available, set it to 0
      const dateB = b.last_matched ? new Date(b.last_matched) : new Date(0);

      return dateA.getTime() - dateB.getTime();
    });

    return mentorsWithScores;
  } catch (error: any) {
    console.error('⚠️ Error fetching mentors:', error.message);

    throw error;
  }
};
