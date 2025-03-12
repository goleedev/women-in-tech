import { User } from './user';

export type Mentor = User & {
  is_available: boolean; // ✅ If the mentor is accepting mentees
  expertise: string[]; // ✅ Areas of expertise
  mentor_since: string; // ✅ Date when they started mentoring
  rating?: number; // ✅ Optional: Average rating from mentees
};
