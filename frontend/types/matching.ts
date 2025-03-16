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
  id: number;
  mentee_id: number;
  mentor_id: number;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
}

// ✅ id와 created_at이 아직 없는 상태의 요청 데이터
export type MentorshipRequestDraft = Omit<
  MentorshipRequest,
  'id' | 'created_at'
>;
