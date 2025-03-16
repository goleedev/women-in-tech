export interface Mentor {
  id: number;
  name: string;
  email: string;
  job_title: string;
  country: string;
  tech_stack: string[];
  years_of_experience: number;
}

export interface MentorshipRequest {
  id: number; // 요청 ID (DB의 primary key)
  mentee_id: number; // 요청한 멘티 ID
  mentor_id: number; // 요청받은 멘토 ID
  status: 'pending' | 'matched' | 'rejected'; // 요청 상태
  created_at: string; // 요청 생성 날짜 (ISO 8601 format)
}
