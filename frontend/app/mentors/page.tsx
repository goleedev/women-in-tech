import MentorList from './components/MentorList';
import MentorSearch from './components/MentorSearch';

export default function MentorsPage() {
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Find a Mentor</h1>
      <MentorSearch />
      <MentorList />
    </div>
  );
}
