export type User = {
  id: number;
  name: string;
  email: string;
  country: string;
  city: string;
  job_title: string;
  tech_stack: string[];
  years_of_experience: number;
  mentoring_topics: string[];
  available_times: string[];
  calcom_link?: string;
  created_at: string;
};
