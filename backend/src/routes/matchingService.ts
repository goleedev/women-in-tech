import { Pool } from 'pg';
import pool from '../config/db';

// 멘토 정보 인터페이스
interface Mentor {
  id: number;
  name: string;
  expertise: string[];
  profession: string;
  seniority_level: string;
  country: string;
  last_matched?: string;
  similarity_score?: number;
}

// 멘티 정보 인터페이스
interface Mentee {
  id: number;
  name: string;
  expertise: string[];
  profession: string;
  seniority_level: string;
  country: string;
  preferred_language?: string;
  career_goals?: string[];
}

/**
 * 멘티에 적합한 멘토를 찾는 서비스 클래스
 */
export class MentorMatchingService {
  private db: Pool;

  constructor() {
    this.db = pool;
  }

  /**
   * 멘티 ID를 기반으로 매칭되는 멘토 목록을 반환
   */
  async findMentorForMentee(
    menteeId: number,
    limit: number = 5
  ): Promise<Mentor[]> {
    try {
      // 멘티 정보 가져오기
      const menteeResult = await this.db.query(
        `SELECT 
          id, name, tech_stack as expertise, job_title as profession, 
          CASE 
            WHEN years_of_experience < 2 THEN 'Entry'
            WHEN years_of_experience BETWEEN 2 AND 5 THEN 'Mid-level'
            ELSE 'Senior'
          END as seniority_level,
          country,
          languages as preferred_language,
          mentoring_topics as career_goals
        FROM users WHERE id = $1`,
        [menteeId]
      );

      if (menteeResult.rows.length === 0) {
        throw new Error('Mentee not found');
      }

      const mentee: Mentee = menteeResult.rows[0];

      // 멘토 정보 가져오기 (이미 매칭된 멘토는 제외)
      const mentorsResult = await this.db.query(
        `SELECT 
          u.id, u.name, u.tech_stack as expertise, u.job_title as profession,
          CASE 
            WHEN u.years_of_experience < 2 THEN 'Entry'
            WHEN u.years_of_experience BETWEEN 2 AND 5 THEN 'Mid-level'
            ELSE 'Senior'
          END as seniority_level,
          u.country,
          (SELECT MAX(created_at) FROM matching_requests WHERE mentor_id = u.id) as last_matched
        FROM users u
        WHERE u.id != $1
        AND u.job_title IS NOT NULL
        AND u.id NOT IN (
          SELECT mentor_id FROM matching_requests 
          WHERE mentee_id = $1 AND status != 'rejected'
        )`,
        [menteeId]
      );

      const mentors: Mentor[] = mentorsResult.rows;

      // 멘토와 멘티의 유사도 점수 계산
      const scoredMentors = mentors.map((mentor) => {
        const similarityScore = this.calculateSimilarityScore(mentee, mentor);
        return { ...mentor, similarity_score: similarityScore };
      });

      // 유사도 점수 내림차순 정렬 및 최근 매칭이 없는 멘토 우선
      return scoredMentors
        .sort((a, b) => {
          // 유사도 점수가 같으면 최근에 매칭되지 않은 멘토 우선
          if (b.similarity_score === a.similarity_score) {
            if (!a.last_matched) return -1;
            if (!b.last_matched) return 1;
            return (
              new Date(a.last_matched).getTime() -
              new Date(b.last_matched).getTime()
            );
          }
          return b.similarity_score! - a.similarity_score!;
        })
        .slice(0, limit);
    } catch (error) {
      console.error('Error in findMentorForMentee:', error);
      throw error;
    }
  }

  /**
   * 멘토와 멘티 간의 유사도 점수 계산
   * 점수가 높을수록 더 적합한 매치
   */
  private calculateSimilarityScore(mentee: Mentee, mentor: Mentor): number {
    let score = 0;

    // 1. 전문 분야 (expertise) 매칭 (가중치: 3)
    const expertiseOverlap = this.calculateArrayOverlap(
      mentee.expertise,
      mentor.expertise
    );
    score += expertiseOverlap * 3;

    // 2. 직업 (profession) 매칭 (가중치: 2)
    if (mentee.profession === mentor.profession) {
      score += 2;
    }

    // 3. 경력 수준 (seniority_level) 고려 (가중치: 1.5)
    // 멘토는 멘티보다 경력이 높아야 적합
    const seniorityLevels = ['Entry', 'Mid-level', 'Senior'];
    const menteeSeniorityIndex = seniorityLevels.indexOf(
      mentee.seniority_level
    );
    const mentorSeniorityIndex = seniorityLevels.indexOf(
      mentor.seniority_level
    );

    if (mentorSeniorityIndex > menteeSeniorityIndex) {
      score += 1.5;
    } else if (mentorSeniorityIndex === menteeSeniorityIndex) {
      score += 0.5;
    }

    // 4. 지역 (country) 고려 (가중치: 2 - 같은 국가, 1 - 다른 국가)
    if (mentee.country === mentor.country) {
      score += 2;
    } else {
      score += 1;
    }

    // 5. 선호 언어 고려 (가중치: 1)
    if (
      mentee.preferred_language &&
      mentor.expertise.includes(mentee.preferred_language)
    ) {
      score += 1;
    }

    return score;
  }

  /**
   * 두 배열 간의 교집합 비율 계산
   */
  private calculateArrayOverlap(arr1: string[], arr2: string[]): number {
    if (!arr1 || !arr2 || arr1.length === 0 || arr2.length === 0) {
      return 0;
    }

    // 대소문자 구분 없이 비교를 위해 소문자로 변환
    const set1 = new Set(arr1.map((item) => item.toLowerCase()));
    const set2 = new Set(arr2.map((item) => item.toLowerCase()));

    // 교집합 계산
    let intersection = 0;
    for (const item of set1) {
      if (set2.has(item)) {
        intersection++;
      }
    }

    // 교집합 / 합집합 비율 계산 (Jaccard 계수)
    return intersection / (set1.size + set2.size - intersection);
  }
}

// 매칭 서비스 싱글톤 인스턴스
export const mentorMatchingService = new MentorMatchingService();
