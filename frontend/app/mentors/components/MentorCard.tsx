import { Mentor } from '@/types/matching';
import MentorActions from './MentorActions';

export default function MentorCard({ mentor }: { mentor: Mentor }) {
  return (
    <div className="p-4 border rounded shadow">
      <h2 className="font-bold">{mentor.name}</h2>
      <p>{mentor.job_title}</p>
      <p>{mentor.country}</p>
      <MentorActions mentorId={mentor.id} />
    </div>
  );
}
