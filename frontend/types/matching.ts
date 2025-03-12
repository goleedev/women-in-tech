export type MatchingRequest = {
  id: number;
  mentee_id: number;
  preferred_tech_stack: string[];
  preferred_experience: number;
  preferred_location?: string;
  status: 'pending' | 'matched' | 'rejected';
  created_at: string;
};
